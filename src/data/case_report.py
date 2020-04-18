import pymc3
import pandas as pd
import numpy as np
from scipy import stats as sps

WINDOW = 7

R_T_MAX = 12
r_t_range = np.linspace(0, R_T_MAX, R_T_MAX*100+1)

# Gamma is 1/serial interval
# https://wwwnc.cdc.gov/eid/article/26/6/20-0357_article
# https://www.nejm.org/doi/full/10.1056/NEJMoa2001316
GAMMA = 1/4

class CaseReport:
    def __init__(self, cases):
        self.cases = cases
        self.summary = self.case_summary()

    def _prepare_cases(self, cases):
        new_cases = cases.diff()

        smoothed = new_cases.rolling(7,
            win_type='gaussian',
            min_periods=1,
            center=True).mean(std=2).round()

        zeros = smoothed.index[smoothed.eq(0)]
        if len(zeros) == 0:
            idx_start = 0
        else:
            last_zero = zeros.max()
            idx_start = smoothed.index.get_loc(last_zero) + 1

        # End at last non-zero new cases, zero is likely lag in data recording
        nonzero = new_cases.index[new_cases.ne(0)]
        idx_end = smoothed.index.get_loc(nonzero[-1])

        smoothed = smoothed.iloc[idx_start:idx_end]
        original = new_cases.loc[smoothed.index]

        return original, smoothed

    def _get_posteriors(self, sr, sigma=0.15):
        # (1) Calculate Lambda
        lam = sr[:-1].values * np.exp(GAMMA * (r_t_range[:, None] - 1))


        # (2) Calculate each day's likelihood
        likelihoods = pd.DataFrame(
            data = sps.poisson.pmf(sr[1:].values, lam),
            index = r_t_range,
            columns = sr.index[1:])

        # (3) Create the Gaussian Matrix
        process_matrix = sps.norm(loc=r_t_range,
                                  scale=sigma
                                 ).pdf(r_t_range[:, None])

        # (3a) Normalize all rows to sum to 1
        process_matrix /= process_matrix.sum(axis=0)

        # (4) Calculate the initial prior
        prior0 = sps.gamma(a=4).pdf(r_t_range)
        prior0 /= prior0.sum()

        # Create a DataFrame that will hold our posteriors for each day
        # Insert our prior as the first posterior.
        posteriors = pd.DataFrame(
            index=r_t_range,
            columns=sr.index,
            data={sr.index[0]: prior0}
        )

        # We said we'd keep track of the sum of the log of the probability
        # of the data for maximum likelihood calculation.
        log_likelihood = 0.0

        # (5) Iteratively apply Bayes' rule
        for previous_day, current_day in zip(sr.index[:-1], sr.index[1:]):
            #(5a) Calculate the new prior
            current_prior = process_matrix @ posteriors[previous_day]

            #(5b) Calculate the numerator of Bayes' Rule: P(k|R_t)P(R_t)
            numerator = likelihoods[current_day] * current_prior

            #(5c) Calcluate the denominator of Bayes' Rule P(k)
            denominator = np.sum(numerator)

            # Execute full Bayes' Rule
            posteriors[current_day] = numerator/denominator

            # Add to the running sum of log likelihoods
            log_likelihood += np.log(denominator)

        return posteriors, log_likelihood

    def _highest_density_interval(self, pmf, p=.9, title=''):
        # If we pass a DataFrame, just call this recursively on the columns
        if(isinstance(pmf, pd.DataFrame)):
            return pd.DataFrame([self._highest_density_interval(pmf[col], title=str(col)) for col in pmf],
                                index=pmf.columns)

        # Broadcast the probability distribution to an artificial set of samples by
        # repeating each index value N times where N = probability sample_precision
        sample_precision = 1000000
        samples_repeats = np.array(pmf.values * sample_precision)#.astype(int)
        samples = np.repeat(pmf.index, np.array(pmf.values * sample_precision).astype(int))

        # Get HDI
        hdi = pymc3.stats.hpd(samples, credible_interval=p)

        low = hdi[0]
        high = hdi[1]

        return pd.Series([low, high], index=['Rt_low', 'Rt_high'])

    def case_summary(self):
        original, smoothed = self._prepare_cases(self.cases)
        posteriors, p_data = self._get_posteriors(smoothed)
        most_likely = posteriors.idxmax().rename('Rt')

        hdis = self._highest_density_interval(posteriors, p=.95)

        # Look into why you shift -1
        result = pd.DataFrame(original)

        result['date'] = original.index
        result['cases'] = self.cases
        result['new_cases'] = original.fillna(0)
        result['new_cases_smooth'] = smoothed.fillna(0)
        result['Rt'] = most_likely.round(3).values
        result['Rt_low'] = hdis['Rt_low'].round(3).values
        result['Rt_high'] = hdis['Rt_high'].round(3).values

        return result
