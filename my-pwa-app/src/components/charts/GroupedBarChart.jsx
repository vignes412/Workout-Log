import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const GroupedBarChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const validData = data.filter(
      (d) => d.date && !isNaN(new Date(d.date).getTime())
    );
    if (validData.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 100, bottom: 50, left: 80 }; // Increased right margin for legend
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = [...new Set(validData.map((d) => d.date))];
    const muscleGroups = [...new Set(validData.map((d) => d.muscleGroup))];
    const x0 = d3.scaleBand().domain(dates).range([0, width]).padding(0.2);
    const x1 = d3
      .scaleBand()
      .domain(muscleGroups)
      .range([0, x0.bandwidth()])
      .padding(0.05);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(validData, (d) =>
          isNaN(parseFloat(d.totalVolume)) ? 0 : parseFloat(d.totalVolume)
        ),
      ])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Total Volume");

    const color = d3
      .scaleOrdinal()
      .domain(muscleGroups)
      .range(d3.schemeCategory10);
    const bars = g
      .selectAll(".bar")
      .data(validData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x0(d.date) + x1(d.muscleGroup))
      .attr("y", (d) =>
        y(isNaN(parseFloat(d.totalVolume)) ? 0 : parseFloat(d.totalVolume))
      )
      .attr("width", x1.bandwidth())
      .attr(
        "height",
        (d) =>
          height -
          y(isNaN(parseFloat(d.totalVolume)) ? 0 : parseFloat(d.totalVolume))
      )
      .attr("fill", (d) => color(d.muscleGroup));

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

    bars
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Date: ${d.date}<br>Muscle Group: ${
              d.muscleGroup
            }<br>Total Volume: ${parseFloat(d.totalVolume).toFixed(2)}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width + margin.left + 20}, ${margin.top})`
      );
    muscleGroups.forEach((group, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 25)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", color(group));
      legend
        .append("text")
        .attr("x", 30)
        .attr("y", i * 25 + 15)
        .attr("text-anchor", "start")
        .text(group);
    });

    return () => {
      svg.selectAll("*").remove();
      tooltip.remove();
    };
  }, [data]);

  return <svg ref={ref} style={{ display: "block" }} />;
};

export default GroupedBarChart;
