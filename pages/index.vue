<template>
    <div>
        <div class="key">
            <p><span class="keyBox"></span> Percent of positions held by women</p>
            <p style="margin-top:10px">Higher 2017 legislative percentage to lower &rarr;</p>
        </div>

        <div class="states">
            <div v-for="(state,i) in states" class="state stateContainer">
                <h4 style="text-align:center">{{state.key}}</h4>

                <div class="boxLabel" style="text-align:center;margin-bottom:5px">
                    GOVERNOR
                </div>

                <svg :width="width" height="6">
                    <rect :x="governor.x1" y="0" :width="governor.x2-governor.x1" height="5" v-for="governor in governors[state.key]" class="governor" v-tooltip.bottom="governor.name" />
                </svg>


                <div class="legislativeContainer">
                    <div class="boxLabel">
                        LEGISLATURE
                    </div>

                    <div :class="'percentLabel' + (i === 0 ? ' bumpTextUp' : '')" v-if="state.shownRecord">
                        {{Math.round(state.shownRecord.percent)}}% <span v-if="i === 0">of seats<br>held by women</span><br>
                        in {{state.shownRecord.year}}
                    </div>


                    <svg :width="width" :height="height" @mouseout="showLabel(null)">
                        <g>
                            <text x="2" :y="tick.y-2" class="tickLabel" v-for="tick in ticks" v-if="i === 0">{{tick.percent}}%</text>
                            <line :x1="tick.x1" :y1="tick.y" :x2="tick.x2" :y2="tick.y" :class="(tick.percent == 50 ? 'darker' : '')" v-for="tick in ticks" />
                        </g>
                        <path :d="state.area" class="area" />
                        <path :d="state.line" class="line" />

                        <circle :cx="state.shownRecord.x" :cy="state.shownRecord.y" r="3" v-if="state.shownRecord" />

                        <g>
                            <rect class="target" :x="tick.x" :y="tick.y1" :width="tick.width" :height="tick.height" v-for="(tick,i) in horizontalTicks" @mouseover="showLabel(tick.year)" />
                        </g>
                    </svg>
                </div>

                <div class="yearLabels">
                    <div class="leftYearLabel">{{yearExtent[0]}}</div>
                    <div class="rightYearLabel">{{yearExtent[1]}}</div>
                </div>

            </div>
        </div>

        <p class="source">Legislative percentages from 1975 - 1982 computed every other year.</p> <!-- 1976, 1978, 1980, 1982 -->

        <p class="source">Source: Rutgers Center for American Women and Politics | <a href="#">Download data</a></p>
    </div>
</template>

<script>
import seats from '~/assets/seats.csv';
import execs from '~/assets/execs.csv';
import * as d3 from 'd3';
import * as journalize from 'journalize';

export default {
    data() {
        let width = 128;
        let height = 215;

        let records = seats
            .map(d => {
                let percent = parseInt(d['Total Women Legislators'].replace(/[^0-9]*/g, '')) /
                    parseInt(d['Total Legislators']) * 100;

                percent = Math.round(percent * 10) / 10;

                /*
                if (parseFloat(d['Total % Women']) !== percent) {
                    console.log(d.State, d.Year, d['Total % Women'], percent);
                }
                */

                return {
                    state: d.State,
                    year: parseInt(d.Year),
                    percent: percent
                };
            })
            .sort((a, b) => a.year - b.year);

        let x = d3.scaleLinear().range([0, width]);

        let yearExtent = d3.extent(records, d => d.year);

        x.domain(yearExtent);

        let y = d3
            .scaleLinear()
            .domain([0, 100])
            .range([height - 2, 0]);

        records.forEach(d => {
            d.y = y(d.percent);
            d.x = x(d.year);
        });

        let line = d3
            .line()
            .defined(d => d)
            .x(d => x(d.year))
            .y(d => y(d.percent));

        let area = d3
            .area()
            .x(d => x(d.year))
            .y1(d => y(d.percent));

        area.y0(y(0));

        // let states = topairs(groupby(records, 'state'));

        let states = d3
            .nest()
            .key(d => d.state)
            .entries(records);

        states
            .sort(
                (a, b) =>
                    b.values[b.values.length - 1].percent -
                    a.values[a.values.length - 1].percent
            )
            .forEach(state => {
                state.shownRecord = null; // state.values[state.values.length - 1];
                state.area = area(state.values);
                state.line = line(state.values);
            });

        let governors = execs
            .filter(exec => exec.Position.trim() === 'Governor')
            .map(exec => {
                let years = exec.Years
                    .split('-')
                    .map(year => (year === 'present' ? '2017' : year));

                return {
                    position: exec.Position,
                    years,
                    x1: x(parseInt(years[0])),
                    x2: x(parseInt(years[1])),
                    state: journalize.postal(exec.State, true),
                    name: exec.Name
                };
            })
            .filter(exec => exec.x2 > 0);

        governors = d3.nest()
            .key((d) => d.state)
            .object(governors);

        let ticks = [25, 50, 75]
            .map((percent) => {
                return {
                    percent,
                    y: y(percent),
                    x1: 0,
                    x2: width
                };
            });

        let horizontalTicks = [];

        for (let i = yearExtent[0]; i <= yearExtent[1]; i++) {
            horizontalTicks.push(i);
        }

        horizontalTicks = horizontalTicks
            .map((year) => {
                let w = (width + 20) / horizontalTicks.length;

                return {
                    year,
                    y: 0,
                    height,
                    x: x(year) - (w / 2),
                    width: w
                };
            });
/*
        states.forEach(state => {
            horizontalTicks.forEach(tick => {
                let result = state.values.find(d => d.year === tick.year);
                if (typeof result === 'undefined' || !result) {
                    console.log(state.key, tick.year, result);
                }
            });
        });
*/
        return {
            ticks,
            yearExtent,
            horizontalTicks,
            states,
            governors,
            width,
            height,
            shownYear: null,
            missingYears: [1976, 1978, 1980, 1982]
        };
    },
    methods: {
        showLabel(year) {
            this.shownYear = year;

            if (this.missingYears.indexOf(year) !== -1) {
                year--;
            }

            this.states.forEach((state) => {
                state.shownRecord = state.values.find((d) => d.year === year);
            });
        }
    }
};
</script>

<style>
.stateContainer {
    width: 130px;
    display: inline-block;
    float: left;
    margin: 5px;
}
.state h4 {
    font-size: 14px;
    line-height: 14px;
}
svg {
    display: block;
    width: 100%;
    margin-top: 6px;
    border: 1px solid rgb(200,200,200);
    overflow: visible;
}
svg .area {
    fill: #ff6480;
}
svg .line {
    fill: none;
    stroke: black;
    stroke-width: 1px;
}
.states:after {
    content: "";
    display: table;
    clear: both;
}
.governor {
    fill: #ff6480;
    stroke: black;
    stroke-width: 1px;
    shape-rendering: optimizeSpeed;
}
.yearLabels {
    font-size: 13px;
    line-height: 13px;
    color: rgb(150,150,150);
    padding-top: 3px;
}
.yearLabels:after {
    content: "";
    display: table;
    clear: both;
}
.leftYearLabel {
    float: left;
}
.rightYearLabel {
    float: right;
}
line {
    stroke: rgb(218,218,218);
    stroke-width: 1px;
    shape-rendering: optimizeSpeed;
}
.darker {
    stroke: rgb(200,200,200);
}
.tickLabel {
    font-size: 13px;
    line-height: 13px;
    fill: rgb(150,150,150);
}
.boxLabel {
    font-size: 13px;
    line-height: 13px;
    color: rgb(150,150,150);
    fill: rgb(150,150,150);
    margin-top: 2px;
}
.target {
    fill: transparent;
}
.legislativeContainer {
    position: relative;
}
.legislativeContainer .boxLabel {
    position: absolute;
    top: 18px;
    text-align: center;
    width: 100%;
}
.percentLabel {
    font-size: 13px;
    line-height: 15px;
    color: rgb(150,150,150);
    fill: rgb(150,150,150);
    position: absolute;
    top: 45%;
    margin-top: -30px;
    text-align: center;
    width: 100%;
    pointer-events: none;
}
circle {
    stroke: white;
    stroke-width: 1.5px;
}
.key {
    font-size: 14px;
    line-height: 16px;
}
.vue-tooltip {
    font-family: tablet-gothic-n2,tablet-gothic,Helvetica Neue,Helvetica,Arial,sans-serif;
    line-height: 14px;
    font-weight: 300;
    font-size: 14px;
}
.key p {
    margin-bottom: 0;
    padding-bottom: 0;
    padding-left: 5px;
}
.keyBox {
    background-color: #ff6480;
    border: 1px solid black;
    display: inline-block;
    width: 14px;
    height: 14px;
    position: relative;
    top: 2px;
}
.source {
    line-height: 15px;
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}
.bumpTextUp {
    margin-top: -37px;
}
</style>
