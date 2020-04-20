import React from "react"
import { getStateCases } from "../util/store"
import * as d3 from "d3"
import moment from "moment"
import chroma from "chroma-js"

import find from "lodash/find"
import zip from "lodash/zip"
import max from "lodash/max"
import min from "lodash/min"

window.d3 = d3

const INSET = {
  top: 30,
  right: 5,
  bottom: 30,
  left: 20,
}

export default class RtPlot extends React.Component {
  constructor(props) {
    super()

    this.state = {
      cases: props.cases,
      active: null,
    }
  }

  componentDidMount() {
    if (this.props.cases) {
      return
    }

    getStateCases().then((cases) => {
      this.setState({
        cases: find(
          cases,
          (c) => c.state.toLowerCase() === this.props.state.toLowerCase()
        ),
      })
    })
  }

  setActive(active) {
    if (active) {
      console.log(active)
    }
    this.setState({ active })
  }

  get x_width() {
    return this.props.width - INSET.left - INSET.right
  }

  get y_height() {
    return this.props.height - INSET.top - INSET.bottom
  }

  get dates() {
    return this.state.cases.date.map((d) => Date.parse(d))
  }

  get x() {
    const today = Date.parse(moment().format("YYYY-MM-DD"))

    return d3
      .scaleTime()
      .domain([Date.parse("2020-03-01"), today])
      .range([0, this.x_width])
      .nice()
  }

  get y() {
    return d3
      .scaleLinear()
      .domain([0, 5])
      .range([this.y_height, 0])
  }

  get newCases() {
    const new_cases_smooth = this.state.cases.new_cases_smooth

    return chroma
      .scale(["red", "gray", "black"])
      .gamma(1.2)
      .mode("lch")
      .domain([max(new_cases_smooth), min(new_cases_smooth)])
  }

  get rt() {
    return this.dates.reduce((accum, date, i) => {
      accum.push({
        date,
        rt: this.state.cases.Rt[i],
        new_cases_smooth: this.state.cases.new_cases_smooth[i],
        new_cases: this.state.cases.new_cases_smooth[i],
        rt_low: this.state.cases.Rt_low[i],
        rt_high: this.state.cases.Rt_high[i],
      })
      return accum
    }, [])
  }

  get rtPath() {
    return d3
      .line()
      .x((d) => this.x(d.date))
      .y((d) => this.y(d.rt))
      .curve(d3.curveCatmullRom)(this.rt)
  }

  get rtArea() {
    return d3
      .area()
      .curve(d3.curveCatmullRom)
      .x((d) => this.x(d.date))
      .y0((d) => this.y(d.rt_high))
      .y1((d) => this.y(d.rt_low))(this.rt)
  }

  render() {
    if (!this.state.cases) {
      return null
    }

    const { cases, active } = this.state
    const { x, y, newCases, x_width, y_height } = this
    const { width, height } = this.props

    const yTicks = [0, 1, 2, 3, 4, 5]
    const xTicksMonth = x.ticks(d3.timeWeek.every(2))
    const xTicksDay = x.ticks(d3.timeDay.every(1))

    const labelX = 66
    const dataX = 72

    return (
      <svg width={width} height={height} className="m-2">
        <g
          transform={`translate(${INSET.left}, ${INSET.top})`}
          clipPath="url(#plot)"
        >
          <clipPath id="plot">
            <rect width={x_width} height={y_height} />
          </clipPath>

          <path
            d={this.rtArea}
            stroke="none"
            className="text-gray-200 fill-current"
          />
          {yTicks.slice(1, -1).map((tick) => (
            <line
              key={tick}
              className="axis text-gray-300 stroke-current"
              x1={0}
              x2={x_width}
              y1={y(tick)}
              y2={y(tick)}
              strokeDasharray="4 4"
            />
          ))}
          <path
            d={this.rtPath}
            fill="none"
            strokeWidth={2}
            className="text-gray-500 stroke-current"
          />
          <g>
            {this.rt.map((day, i) => {
              const { date, rt, new_cases_smooth } = day
              const rt_x = x(date)
              const rt_y = y(rt)

              return (
                <circle
                  onMouseEnter={() => this.setActive(day)}
                  onMouseLeave={() => this.setActive()}
                  cx={rt_x}
                  cy={rt_y}
                  r={3}
                  fill={newCases(new_cases_smooth)}
                  key={date}
                />
              )
            })}
          </g>
        </g>
        <g transform={`translate(${INSET.left}, ${y_height + INSET.top})`}>
          <clipPath>
            <rect width={x_width} height={height - y_height - INSET.top} />
          </clipPath>
          <line
            className="axis text-gray-600 stroke-current"
            x1={0}
            x2={x_width}
            y1={0}
            y2={0}
          />
          {xTicksDay.map((tick) => {
            return (
              <line
                className="axis text-gray-600 stroke-current"
                x1={x(tick)}
                x2={x(tick)}
                y0={0}
                y1={3}
                key={tick}
              />
            )
          })}
          {xTicksMonth.map((tick) => {
            return (
              <g transform={`translate(${x(tick)}, 0)`} key={tick}>
                <line
                  className="axis text-gray-600 stroke-current"
                  x1={0}
                  x2={0}
                  y0={0}
                  y1={5}
                />
                <text
                  className="text-xs text-gray-700 fill-current antialiased"
                  dy="1.8em"
                  textAnchor="middle"
                >
                  {moment.utc(tick).format("D MMM")}
                </text>
              </g>
            )
          })}
        </g>
        <g transform={`translate(0, ${INSET.top})`}>
          <clipPath>
            <rect width={INSET.left} height={y_height} />
          </clipPath>
          <line
            className="axis text-gray-600 stroke-current"
            x1={INSET.left}
            x2={INSET.left}
            y1={0}
            y2={y_height}
          />
          {yTicks.map((tick, i) => (
            <g transform={`translate(0, ${y(tick)})`} key={y(tick)}>
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
            <rect width={x_width} height={INSET.top} />
          </clipPath>
          <text x={x_width / 2 - INSET.left / 2} y={20} textAnchor="middle">
            {cases.state}
          </text>
        </g>
        {active != null && (
          <g
            transform={`translate(${INSET.left + x_width - 110}, ${INSET.top})`}
          >
            <rect x={0} y={-20} height="110" width="110" fill="white" />

            <text
              textAnchor="middle"
              className="text-xs text-gray-700 font-bold fill-current antialiased"
              x={55}
              y={0}
            >
              {moment.utc(active.date).format("D MMM 'YY")}
            </text>
            <text
              textAnchor="end"
              className="text-xs text-gray-700 fill-current antialiased"
              x={labelX}
              y={20}
            >
              Rt (likely):
            </text>
            <text
              textAnchor="end"
              className="text-xs text-gray-700 fill-current antialiased"
              x={labelX}
              y={40}
            >
              Rt (low):
            </text>
            <text
              textAnchor="end"
              className="text-xs text-gray-700 fill-current antialiased"
              x={labelX}
              y={60}
            >
              Rt (high):
            </text>
            <text
              textAnchor="end"
              className="text-xs text-gray-700 fill-current antialiased"
              x={labelX}
              y={80}
            >
              New cases:
            </text>
            <text
              textAnchor="start"
              className="text-xs text-gray-700 font-bold fill-current antialiased"
              x={dataX}
              y={20}
            >
              {active.rt}
            </text>
            <text
              textAnchor="start"
              className="text-xs text-gray-700 font-bold fill-current antialiased"
              x={dataX}
              y={40}
            >
              {active.rt_low}
            </text>
            <text
              textAnchor="start"
              className="text-xs text-gray-700 font-bold fill-current antialiased"
              x={dataX}
              y={60}
            >
              {active.rt_high}
            </text>
            <text
              textAnchor="start"
              className="text-xs text-gray-700 font-bold fill-current antialiased"
              x={dataX}
              y={80}
            >
              {active.new_cases}
            </text>
          </g>
        )}
      </svg>
    )
  }
}

RtPlot.defaultProps = {
  width: 500,
  height: 400,
}
