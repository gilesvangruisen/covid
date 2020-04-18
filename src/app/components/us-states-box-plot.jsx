import React from "react"
import { getStateCases } from "../util/store"
import * as d3 from "d3"
import sortBy from "lodash/sortBy"
import moment from "moment"

const WIDTH = 1000
const HEIGHT = 280

const INSET = {
  top: 30,
  right: 30,
  bottom: 100,
  left: 30,
}

const X_WIDTH = WIDTH - INSET.left - INSET.right
const Y_HEIGHT = HEIGHT - INSET.top - INSET.bottom

export default class USStatesBoxPlot extends React.Component {
  constructor() {
    super()

    this.state = {
      states: [],
      active: null,
      sort: "rt",
    }
  }

  setActive(active) {
    this.setState({ active })
  }

  get states() {
    const states = this.state.states.map((state) => {
      const last_idx = state.Rt.length - 1

      return {
        ...state,
        rt: state.Rt[last_idx],
        rt_high: state.Rt_high[last_idx],
        rt_low: state.Rt_low[last_idx],
        date: state.date[last_idx],
      }
    })

    if (this.state.sort == "alpha") {
      return states
    } else if (this.state.sort == "rt") {
      return sortBy(states, (state) => state.rt)
    } else if (this.state.sort == "rt_low") {
      return sortBy(states, (state) => state.rt_low)
    } else if (this.state.sort == "rt_high") {
      return sortBy(states, (state) => state.rt_high)
    }
  }

  get x() {
    const bands = this.states.map((_, i) => i)

    return d3
      .scaleBand()
      .range([0, X_WIDTH])
      .padding(0.1)
      .domain(bands)
  }

  get y() {
    return d3
      .scaleLinear()
      .domain([0, 2])
      .range([Y_HEIGHT, 0])
  }

  get stateNames() {
    return this.states.map((state) => {
      if (state.state == "Washington") {
        return "Washington State"
      } else if (state.state == "District of Columbia") {
        return "Washington D.C."
      } else {
        return state.state
      }
    })
  }

  componentDidMount() {
    getStateCases()
      .then((states) => {
        this.setState({ states })
      })
      .catch((e) => console.error(e))
  }

  render() {
    const x = this.x
    const y = this.y
    const bandwidth = x.bandwidth()
    const yTicks = [0, 0.5, 1, 1.5, 2]
    const { active, sort } = this.state

    return (
      <svg width={WIDTH} height={HEIGHT} className="mx-auto">
        <g transform={`translate(0, ${INSET.top})`}>
          <clipPath>
            <rect width={INSET.left} height={Y_HEIGHT} />
          </clipPath>
          <line
            className="axis text-gray-600 stroke-current"
            x1={INSET.left}
            x2={INSET.left}
            y1={0}
            y2={Y_HEIGHT}
          />
          {yTicks.map((tick) => (
            <g transform={`translate(0, ${y(tick)})`} key={tick}>
              <line
                className="axis text-gray-600 stroke-current"
                x1={INSET.left - 5}
                x2={INSET.left}
                y1={0}
                y2={0}
              />
              <text
                x={INSET.left - 8}
                className="text-xs text-gray-700 fill-current antialiased"
                textAnchor="end"
                dy="0.35em"
              >
                {tick}
              </text>
            </g>
          ))}
        </g>
        <g transform={`translate(${INSET.left}, 0)`}>
          <clipPath>
            <rect width={X_WIDTH} height={INSET.top} />
          </clipPath>
        </g>
        <g transform={`translate(${INSET.left}, ${INSET.top})`}>
          <clipPath>
            <rect width={X_WIDTH} height={Y_HEIGHT} />
          </clipPath>

          <g>
            {this.states.map((state, i) => {
              const rt_y = y(state.rt)
              const rt_low_y = y(state.rt_low)
              const rt_high_y = y(state.rt_high)
              const height = Y_HEIGHT - rt_y
              const lineCapWidth = 6

              return (
                <g
                  transform={`translate(${x(i)}, 0)`}
                  key={state.state}
                  onMouseEnter={() => this.setActive(state)}
                  onMouseLeave={() => this.setActive()}
                >
                  <rect
                    y={rt_y}
                    width={bandwidth}
                    height={height}
                    className="text-gray-300 fill-current"
                  />
                  <line
                    x1={bandwidth / 2 - lineCapWidth / 2}
                    x2={bandwidth / 2 + lineCapWidth / 2}
                    className="line-cap text-gray-700 stroke-current"
                    y1={rt_high_y}
                    y2={rt_high_y}
                  />
                  <line
                    x1={bandwidth / 2}
                    x2={bandwidth / 2}
                    className="line-cap text-gray-700 stroke-current"
                    y1={rt_low_y}
                    y2={rt_high_y}
                  />
                  <line
                    x1={bandwidth / 2 - lineCapWidth / 2}
                    x2={bandwidth / 2 + lineCapWidth / 2}
                    className="line-cap text-gray-700 stroke-current"
                    y1={rt_low_y}
                    y2={rt_low_y}
                  />
                </g>
              )
            })}
            <line
              x1={0}
              x2={X_WIDTH}
              className="line-cap text-gray-700 stroke-current"
              strokeDasharray="3 3"
              y1={y(1)}
              y2={y(1)}
            />
          </g>
        </g>
        <g transform={`translate(${INSET.left}, ${Y_HEIGHT + INSET.top})`}>
          <clipPath>
            <rect width={X_WIDTH} height={HEIGHT - Y_HEIGHT - INSET.top} />
          </clipPath>
          <line
            className="axis text-gray-600 stroke-current"
            x1={0}
            x2={X_WIDTH}
            y1={0}
            y2={0}
          />
          {this.stateNames.map((state, i) => {
            return (
              <g transform={`translate(${x(i)}, 0)`} key={state}>
                <line
                  className="axis text-gray-600 stroke-current"
                  x1={bandwidth / 2}
                  x2={bandwidth / 2}
                  y1={0}
                  y2={4}
                />
                <text
                  transform={`translate(0, 8) rotate(-90)`}
                  className="text-xs text-gray-700 fill-current antialiased"
                  dy="0.9em"
                  textAnchor="end"
                >
                  {state}
                </text>
              </g>
            )
          })}
        </g>
        {active != null && (
          <g transform={`translate(${INSET.left + 10}, 20)`}>
            <rect x={0} y={-20} height={50} width={280} fill="white" />
            <text
              x={5}
              className="text-xs text-gray-700 font-bold fill-current antialiased"
            >
              {active.state} ({moment(active.date).format("D MMM 'YY")})
            </text>
            <text
              className="text-xs text-gray-700 fill-current antialiased"
              x={5}
              y={20}
            >
              Rt (likely): {active.rt}
              &nbsp;&nbsp;&nbsp;&nbsp; Rt (low): {active.rt_low}
              &nbsp;&nbsp;&nbsp;&nbsp; Rt (high): {active.rt_high}
            </text>
          </g>
        )}

        <g transform={`translate(${INSET.left + X_WIDTH - 240}, 20)`}>
          <rect x={0} y={-20} height={30} width={240} fill="white" />
          <text
            x={5}
            className={`text-xs text-gray-700 fill-current antialiased`}
          >
            Sort:
          </text>
          <text
            x={50}
            textAnchor="middle"
            onClick={() => this.setState({ sort: "alpha" })}
            className={`text-xs cursor-pointer text-gray-700 ${
              sort == "alpha" ? "font-bold " : ""
            } fill-current antialiased`}
          >
            Alpha
          </text>
          <text
            x={100}
            textAnchor="middle"
            onClick={() => this.setState({ sort: "rt" })}
            className={`text-xs cursor-pointer text-gray-700 ${
              sort == "rt" ? "font-bold " : ""
            }fill-current antialiased`}
          >
            Rt (likely)
          </text>
          <text
            x={156}
            textAnchor="middle"
            onClick={() => this.setState({ sort: "rt_low" })}
            className={`text-xs cursor-pointer text-gray-700 ${
              sort == "rt_low" ? "font-bold " : ""
            }fill-current antialiased`}
          >
            Rt (low)
          </text>
          <text
            x={210}
            textAnchor="middle"
            onClick={() => this.setState({ sort: "rt_high" })}
            className={`text-xs cursor-pointer text-gray-700 ${
              sort == "rt_high" ? "font-bold " : ""
            }fill-current antialiased`}
          >
            Rt (high)
          </text>
        </g>
      </svg>
    )
  }
}
