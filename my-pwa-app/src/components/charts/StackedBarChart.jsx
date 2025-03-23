import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const StackedBarChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const validData = data.filter(
      (d) => d.date && !isNaN(new Date(d.date).getTime())
    );
    if (validData.length === 0) return;

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
      .scaleBand()
      .domain(validData.map((d) => d.date))
      .range([0, width])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          validData,
          (d) =>
            (isNaN(parseFloat(d.averageReps)) ? 0 : parseFloat(d.averageReps)) +
            (isNaN(parseFloat(d.averageWeight))
              ? 0
              : parseFloat(d.averageWeight))
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
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Avg Reps + Weight");

    const stack = d3.stack().keys(["averageReps", "averageWeight"]);
    const stackedData = stack(
      validData.map((d) => ({
        date: d.date,
        averageReps: isNaN(parseFloat(d.averageReps))
          ? 0
          : parseFloat(d.averageReps),
        averageWeight: isNaN(parseFloat(d.averageWeight))
          ? 0
          : parseFloat(d.averageWeight),
      }))
    );

    const bars = g
      .selectAll(".stack")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d, i) => (i === 0 ? "steelblue" : "lightblue"))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.date))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

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
            `Date: ${d.data.date}<br>Avg Reps: ${d.data.averageReps.toFixed(
              2
            )}<br>Avg Weight: ${d.data.averageWeight.toFixed(2)}`
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

export default StackedBarChart;
