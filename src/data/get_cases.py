import pandas as pd
import io
import os

NYT_COUNTY_CSV = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"
LOCAL_COUNTY_CSV = "us-counties.csv"
NYT_STATE_CSV = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
LOCAL_STATE_CSV = "us-states.csv"

NYT_COUNTY_COLS = ['date','county','state','fips','cases','deaths']
NYT_STATE_COLS = ['date','state','fips','cases','deaths']

def get_county_cases():
    file = os.path.join(os.getcwd(), LOCAL_COUNTY_CSV)

    data = pd.read_csv(NYT_COUNTY_CSV,
        names=NYT_COUNTY_COLS,
        skiprows=1,
        index_col=['state', 'county', 'date'],
        parse_dates=['date'],
        squeeze=True).sort_index()

    return data.query("county != 'Unknown'")

def get_state_cases():
    file = os.path.join(os.getcwd(), LOCAL_STATE_CSV)

    data = pd.read_csv(NYT_STATE_CSV,
        names=NYT_STATE_COLS,
        skiprows=1,
        index_col=['state', 'date'],
        parse_dates=['date'],
        squeeze=True).sort_index()

    return data
