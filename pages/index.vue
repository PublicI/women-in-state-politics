<template>
    <div>
        <no-ssr>
                <div class="key">
                    <p><span class="keyBox"></span> Percent of positions held by women</p>
                    <p><span class="keyBoxDashed"></span> Percent of women in legislature recorded every other year or each session of congress</p> <!-- 1976, 1978, 1980, 1982 -->
                    <p style="margin-top:10px">Ordered by higher 2017 legislative percentage to lower &rarr;</p>
                </div>

                <div class="states">
                    <div v-for="(state,i) in states" class="state stateContainer">
                        <h4 style="text-align:center">{{state.key}}</h4>

                        <div class="boxLabel" style="text-align:center;margin-bottom:5px">
                            {{state.key == 'U.S.' ? 'PRESIDENT' : 'GOVERNOR' }}
                        </div>

                        <svg :width="width" height="7">
                            <rect :x="governor.x1" y="0" :width="governor.x2-governor.x1" height="5.5" v-for="governor in governors[state.key]" class="governor" v-tooltip.bottom="governor.name" />
                        </svg>


                        <div class="legislativeContainer">
                            <div class="boxLabel">
                                {{state.key == 'U.S.' ? 'CONGRESS' : 'LEGISLATURE' }}
                            </div>

                            <div :class="'percentLabel' + (i === 0 ? ' bumpTextUp' : '')" v-if="state.shownRecord">
                                {{Math.round(state.shownRecord.percent)}}% <span v-if="i === 0">of seats<br>held by women</span><br>
                                in {{state.shownRecord.year}}
                            </div>


                            <svg :width="width" :height="height" @mouseout="showLabel(null,null)" xmlns="http://www.w3.org/2000/svg">
                                <!--
                                <defs>
                                  <linearGradient id='grad'>
                                    <stop stop-color='#FDBACA'/>
                                    <stop offset='18.9%' stop-color='#FDBACA'/>
                                    <stop offset='19%' stop-color='#ff6480'/>
                                  </linearGradient>
                                </defs>
                                -->

                                <g>
                                    <text x="2" :y="tick.y-2" class="tickLabel" v-for="tick in ticks" v-if="i === 0">{{tick.percent}}%</text>
                                    <line :x1="tick.x1" :y1="tick.y" :x2="tick.x2" :y2="tick.y" :class="(tick.percent == 50 ? 'darker' : '')" v-for="tick in ticks"  />
                                </g>
                                <path :d="state.area" class="area" />
                                <path :d="state.line" class="line" />

                                <path :d="state.areaDashed" class="area dashed" />
                                <path :d="state.lineDashed" class="line dashed" stroke-dasharray="4, 4, 4, 4, 4, 4, 4, 4, 4, 4" />
                                <!-- stroke="url(#grad)" -->

                                <circle :cx="state.shownRecord.x" :cy="state.shownRecord.y" r="3" v-if="state.shownRecord" />

                                <g>
                                    <rect class="target" :x="tick.x" :y="tick.y1" :width="tick.width" :height="tick.height" v-for="(tick,i) in horizontalTicks" @mouseover="showLabel(tick.year,state.key)" />
                                </g>
                            </svg>
                        </div>

                        <div class="yearLabels">
                            <div class="leftYearLabel">{{yearExtent[0]}}</div>
                            <div class="rightYearLabel">{{yearExtent[1]}}</div>
                        </div>

                    </div>
                </div>

                <p v-if="filterStates" style="margin-top:20px"><a href="https://www.publicintegrity.org/2018/03/06/21606/share-women-elected-office-every-state" target="_top">See the share of women in elected office in every state &raquo;</a></p>

                <p class="source">Source: Rutgers University <a href="http://www.cawp.rutgers.edu/state-by-state" target="_top">Center for American Women and Politics</a><br><a href="http://www.ncsl.org/legislators-staff/legislators/womens-legislative-network/women-in-state-legislatures-for-2018.aspx" target="_top">National Conference of State Legislatures</a> percentages used for 2007 in Connecticut, 2005 and 2007 in Mississippi and 2007 in Wyoming<br><a href="seats.csv">Download data</a></p>
        </no-ssr>
    </div>
</template>

<script>
import seats from '~/assets/seats.csv';
import execs from '~/assets/govs.csv';
import { line, area, nest, scaleLinear, extent, csvParse } from 'd3';
import { postal } from 'journalize';

export default {
    data() {
        let width = 138-5;
        let height = 223;

        let filterStates = [];
        if (typeof location !== 'undefined' && location.hash) {
            filterStates = location.hash.replace('#', '').split(',').map(state => state.toUpperCase());
        }

        let records = csvParse(seats)
            .map(d => {
                let percent = parseInt(d.cawp_total_women) / // d['Total Women Legislators'].replace(/[^0-9]*/g, '')) /
                    parseInt(d.cawp_total_legislators) * 100; // ['Total Legislators']

                percent = Math.round(percent * 10) / 10;

                /*
                if (parseFloat(d['Total % Women']) !== percent) {
                    console.log(d.State, d.Year, d['Total % Women'], percent);
                }
                */

                return {
                    state: postal(d.state,true),
                    year: parseInt(d.year),
                    percent: percent
                };
            })
            .filter(d => filterStates.length === 0 || filterStates.indexOf(postal(d.state)) !== -1)
            .sort((a, b) => a.year - b.year);

        let x = scaleLinear().range([0, width]);

        let yearExtent = extent(records, d => d.year);

        x.domain(yearExtent);

        let y = scaleLinear()
            .domain([0, 100])
            .range([height - 2, 0]);

        records.forEach(d => {
            d.y = y(d.percent);
            d.x = x(d.year);
        });

        let lineGen = line()
            .x(d => x(d.year))
            .y(d => y(d.percent));

        let areaGen = area()
            .x(d => x(d.year))
            .y1(d => y(d.percent));

        areaGen.y0(y(0));

        // let states = topairs(groupby(records, 'state'));

        let states = nest()
            .key(d => d.state)
            .entries(records);

        states
            .sort(
                (a, b) =>
                    b.values[b.values.length - 1].percent -
                    a.values[a.values.length - 1].percent
            )
            .forEach(state => {
                state.valuesLookup = {};

                state.values.forEach(d => {
                    state.valuesLookup[d.year] = d;
                });

                state.shownRecord = null; // state.values[state.values.length - 1];
                if (state.key !== 'U.S.') {
                    state.area = areaGen(state.values.filter(d => d.year >= 1982));
                    state.line = lineGen(state.values.filter(d => d.year >= 1982));
                    state.areaDashed = areaGen(state.values.filter(d => d.year <= 1983));
                    state.lineDashed = lineGen(state.values.filter(d => d.year <= 1983));
                }
                else {
                    state.area = null;
                    state.line = null;
                    state.areaDashed = areaGen(state.values);
                    state.lineDashed = lineGen(state.values);
                }
            });

        let us = states.find(row => row.key === 'U.S.');

        states = states.filter(row => row.key !== 'U.S.');

        states.unshift(us);

        let governors = csvParse(execs)
            // .filter(exec => exec.Position.trim() === 'Governor')
            .map(exec => {
                let years = exec.Years
                    .split('-')
                    .map(year => (year === 'present' ? '2019' : year));

                return {
                    position: exec.Position,
                    years,
                    x1: x(parseInt(years[0])),
                    x2: x(parseInt(years[1])),
                    state: postal(exec.State, true),
                    name: exec.Name
                };
            })
            .filter(exec => exec.x2 > 0);

        governors = nest()
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
            missingYears: [1976, 1978, 1980, 1982],
            filterStates: filterStates.length > 0
        };
    },
    methods: {
        showLabel(year,state) {
            this.shownYear = year;

            if (this.missingYears.indexOf(year) !== -1 || (state === 'U.S.' && year % 2 === 0)) {
                year--;
            }

            this.states.forEach((state) => {
                state.shownRecord = state.valuesLookup[year];
            });
        }
    }
};
</script>

<style>
.stateContainer {
    width: 135px;
    display: inline-block;
    float: left;
    margin: 4px;
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
svg .area.dashed {
    fill: #FDBACA;
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
    shape-rendering: crispEdges;
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
    line-height: 18px;
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
.keyBoxDashed {
    background-color: #FDBACA;
    border: 1px dashed black;
    display: inline-block;
    width: 14px;
    height: 14px;
    position: relative;
    top: 2px;
}
.source {
    line-height: 17px;
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}
.bumpTextUp {
    margin-top: -37px;
}
</style>
