import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const ScatterPlot = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 40, bottom: 50, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          isNaN(parseFloat(d.maxWeight)) ? 0 : parseFloat(d.maxWeight)
        ),
      ])
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          isNaN(parseFloat(d.averageFatigue)) ? 0 : parseFloat(d.averageFatigue)
        ),
      ])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Max Weight");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Avg Fatigue");

    const dots = g
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) =>
        x(isNaN(parseFloat(d.maxWeight)) ? 0 : parseFloat(d.maxWeight))
      )
      .attr("cy", (d) =>
        y(
          isNaN(parseFloat(d.averageFatigue)) ? 0 : parseFloat(d.averageFatigue)
        )
      )
      .attr("r", 5)
      .attr("fill", "steelblue");

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#f9f9f9")
      .style("padding", "5px")
      .style("border", "1px solid #ddd")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    dots
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Max Weight: ${parseFloat(d.maxWeight).toFixed(
              2
            )}<br>Avg Fatigue: ${parseFloat(d.averageFatigue).toFixed(2)}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    return () => {
      svg.selectAll("*").remove();
      tooltip.remove();
    };
  }, [data]);

  return <svg ref={ref} style={{ display: "block" }} />;
};

export default ScatterPlot;
