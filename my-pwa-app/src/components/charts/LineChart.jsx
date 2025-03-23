import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const LineChart = ({ data, field, label }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const validData = data.filter((d) => !isNaN(new Date(d.date).getTime()));
    if (validData.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const resize = () => {
      const container = ref.current.parentElement;
      const width = container.clientWidth - 80;
      const height = container.clientHeight - 80;

      svg.attr("width", width + 80).attr("height", height + 80);

      const g = svg.select("g");
      if (g.empty()) {
        svg.append("g").attr("transform", "translate(40, 30)");
      }

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

      g.selectAll(".x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

      g.selectAll(".y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5));

      g.selectAll(".x-label")
        .data([null])
        .join("text")
        .attr("class", "x-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Date");

      g.selectAll(".y-label")
        .data([null])
        .join("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text(label);

      const line = d3
        .line()
        .x((d) => x(new Date(d.date)))
        .y((d) => y(isNaN(parseFloat(d[field])) ? 0 : parseFloat(d[field])));

      g.selectAll(".line")
        .data([validData])
        .join("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

      const tooltip = d3
        .select("body")
        .selectAll(".tooltip")
        .data([null])
        .join("div")
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
        .join("circle")
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
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      svg.selectAll("*").remove();
      d3.select(".tooltip").remove();
    };
  }, [data, field, label]);

  return (
    <svg
      ref={ref}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
};

export default LineChart;
