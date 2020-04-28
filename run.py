import json

from src.data.get_cases import get_county_cases, get_state_cases
from src.data.case_report import CaseReport

FILTERED_REGIONS = [
    'Virgin Islands',
    'American Samoa',
    'Northern Mariana Islands',
    'Guam',
]

def run_counties():
    county_data = get_county_cases()
    counties = county_data.groupby(['state', 'county'], as_index=True).size().reset_index()

    counties_json = []

    for index, county in counties.iterrows():
        state = county['state']
        county_name = county['county']

        if state in FILTERED_REGIONS:
            continue

        dat = county_data.xs((state, county_name))
        print(county_name, state)

        report = CaseReport(dat['cases'])
        summary = report.summary

        if summary is None:
            county_json = {
                "county": county_name,
                "state": state,
                "date": dat.index.strftime("%Y-%m-%d").tolist(),
                "cases": dat['cases'].tolist(),
            }
        else:
            county_json = {
                "county": county_name,
                "state": state,
                "date": summary['date'].dt.strftime("%Y-%m-%d").tolist(),
                "cases": summary['cases'].tolist(),
                "new_cases": summary['new_cases'].tolist(),
                "new_cases_smooth": summary['new_cases_smooth'].tolist(),
                "Rt": summary['Rt'].tolist(),
                "Rt_low": summary['Rt_low'].tolist(),
                "Rt_high": summary['Rt_high'].tolist(),
                "Rt_diff_day": summary['Rt'].diff().round(2).fillna(0).tolist(),
                "Rt_diff_week": summary['Rt'].diff(periods=7).round(2).fillna(0).tolist(),
            }

        counties_json.append(county_json)

    with open('counties.json', 'w') as outfile:
        json.dump(counties_json, outfile)

def run_states():
    state_data = get_state_cases()
    states = state_data.groupby(['state'], as_index=True).size().reset_index()
    states_json = []

    for index, state in states.iterrows():
        state_name = state['state']

        if state_name in FILTERED_REGIONS:
            continue

        dat = state_data.xs((state_name))
        print(state_name)

        report = CaseReport(dat['cases'])
        summary = report.summary

        state_json = {
            "state": state_name,
            "date": summary['date'].dt.strftime("%Y-%m-%d").tolist(),
            "cases": summary['cases'].tolist(),
            "new_cases": summary['new_cases'].tolist(),
            "new_cases_smooth": summary['new_cases_smooth'].tolist(),
            "Rt": summary['Rt'].tolist(),
            "Rt_low": summary['Rt_low'].tolist(),
            "Rt_high": summary['Rt_high'].tolist(),
            "Rt_diff_day": summary['Rt'].diff().round(2).fillna(0).tolist(),
            "Rt_diff_week": summary['Rt'].diff(periods=7).round(2).fillna(0).tolist(),
        }

        states_json.append(state_json)

    with open('dist/states.json', 'w') as outfile:
        json.dump(states_json, outfile)


if __name__ == "__main__":
    run_states()
