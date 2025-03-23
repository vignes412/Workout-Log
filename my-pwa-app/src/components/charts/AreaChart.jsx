import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const AreaChart = ({ data, field, label }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const validData = data.filter((d) => !isNaN(new Date(d.date).getTime()));
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
      .scaleTime()
      .domain(d3.extent(validData, (d) => new Date(d.date)))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(validData, (d) =>
          isNaN(parseFloat(d[field])) ? 0 : parseFloat(d[field])
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
      .text(label);

    const area = d3
      .area()
      .x((d) => x(new Date(d.date)))
      .y0(height)
      .y1((d) => y(isNaN(parseFloat(d[field])) ? 0 : parseFloat(d[field])));
    g.append("path")
      .datum(validData)
      .attr("fill", "lightblue")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1)
      .attr("d", area);

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

    g.selectAll(".dot")
      .data(validData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(new Date(d.date)))
      .attr("cy", (d) =>
        y(isNaN(parseFloat(d[field])) ? 0 : parseFloat(d[field]))
      )
      .attr("r", 4)
      .attr("fill", "steelblue")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Date: ${d.date}<br>${label}: ${parseFloat(d[field]).toFixed(2)}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Zooming
    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    return () => {
      svg.selectAll("*").remove();
      tooltip.remove();
    };
  }, [data, field, label]);

  return <svg ref={ref} style={{ display: "block" }} />;
};

export default AreaChart;
