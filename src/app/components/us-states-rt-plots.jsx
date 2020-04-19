import React from "react"
import { getStateCases } from "../util/store"
import * as d3 from "d3"
import d3scale from "d3-scale"

import RtPlot from "./rt-plot"

export default class USStatesRtPlots extends React.Component {
  constructor() {
    super()

    this.state = {
      states: [],
      search: "",
    }
  }

  get plots() {
    const search = this.state.search
    if (search == "") {
      return this.state.states
    }

    return this.state.states.filter((state) =>
      search.split(",").reduce((accum, term) => {
        const trimmed = term.trim()
        return (
          accum ||
          (trimmed != "" && state.state.toLowerCase().indexOf(term.trim()) >= 0)
        )
      }, false)
    )
  }

  componentDidMount() {
    getStateCases()
      .then((states) => {
        this.setState({ states })
      })
      .catch((e) => console.error(e))
  }

  handleSearch(event) {
    this.setState({ search: event.target.value })
  }

  render() {
    const search = search != "" && this.state.search.toLowerCase()

    return (
      <div className="flex flex-col items-center justify-start">
        <label className="block text-sm font-medium leading-5 text-gray-700">
          Filter and compare states
        </label>
        <div className="mt-1 b-4 relative rounded-md shadow-sm">
          <input
            type="text"
            className="form-input block w-64 sm:text-sm sm:leading-5"
            value={this.state.search}
            placeholder="e.g. Rhode Island, New York"
            onChange={(e) => this.handleSearch(e)}
          />
        </div>
        <div className="flex flex-row flex-wrap items-start justify-center">
          {this.plots.map((state) => {
            return (
              <RtPlot
                key={state.state}
                cases={state}
                width={this.props.width}
                height={this.props.height}
              />
            )
          })}
        </div>
      </div>
    )
  }
}

USStatesRtPlots.defaultProps = {
  width: 340,
  height: 220,
}
