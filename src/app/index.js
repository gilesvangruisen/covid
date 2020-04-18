import React from "react"
import ReactDOM from "react-dom"

import USStatesBoxPlot from "./components/us-states-box-plot"
import USStatesRtPlots from "./components/us-states-rt-plots"
import RtPlot from "./components/rt-plot"
import "./index.css"

const usStatesBoxPlotEl = document.getElementById("us-states-box-plot")
ReactDOM.render(
  React.createElement(USStatesBoxPlot, {}, null),
  usStatesBoxPlotEl
)

const rtPlots = document.querySelectorAll(".rt-plot")

rtPlots.forEach((rtPlotEl) => {
  const rtPlotProps = Object.assign({}, rtPlotEl.dataset)
  ReactDOM.render(React.createElement(RtPlot, rtPlotProps, null), rtPlotEl)
})

const usStatesRtPlots = document.getElementById("us-states-rt-plots")
ReactDOM.render(React.createElement(USStatesRtPlots, {}, null), usStatesRtPlots)
