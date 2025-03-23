import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const MultiLineChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const filteredData = data.filter(
      (d) => d.progressionRate !== "N/A" && !isNaN(new Date(d.date).getTime())
    );
    if (filteredData.length === 0) return;

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
      .domain(d3.extent(filteredData, (d) => new Date(d.date)))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain(
        d3.extent(filteredData, (d) =>
          isNaN(parseFloat(d.progressionRate))
            ? 0
            : parseFloat(d.progressionRate)
        )
      )
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
      .text("Progression Rate (%)");

    const line = d3
      .line()
      .x((d) => x(new Date(d.date)))
      .y((d) =>
        y(
          isNaN(parseFloat(d.progressionRate))
            ? 0
            : parseFloat(d.progressionRate)
        )
      );
    g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

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
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(new Date(d.date)))
      .attr("cy", (d) =>
        y(
          isNaN(parseFloat(d.progressionRate))
            ? 0
            : parseFloat(d.progressionRate)
        )
      )
      .attr("r", 4)
      .attr("fill", "steelblue")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Date: ${d.date}<br>Progression Rate: ${parseFloat(
              d.progressionRate
            ).toFixed(2)}%`
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
  }, [data]);

  return <svg ref={ref} style={{ display: "block" }} />;
};

export default MultiLineChart;
