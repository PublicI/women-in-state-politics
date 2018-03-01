<template>
    <div class="states">
        <div v-for="state in states" class="state">
            <h4>{{state.key}}</h4>

            <svg :width="width" height="6">
                <rect :x="governor.x1" y="0" :width="governor.x2-governor.x1" height="100%" v-for="governor in governors[state.key]" />
            </svg>
            <svg :width="width" :height="height">
                <path :d="state.area" class="area" />
                <path :d="state.line" class="line" />
            </svg>
        </div>
    </div>
</template>

<script>
import seats from '~/assets/seats.csv';
import execs from '~/assets/execs.csv';
import * as d3 from 'd3';
import * as journalize from 'journalize';

export default {
    data() {
        let width = 100;
        let height = 200;

        let records = seats
            .map(d => {
                return {
                    state: d.State,
                    year: parseInt(d.Year),
                    percent: parseFloat(d['Total % Women'])
                };
            })
            .sort((a, b) => a.year - b.year);

        let x = d3.scaleLinear().rangeRound([0, width]);

        x.domain(d3.extent(records, d => d.year));

        let y = d3
            .scaleLinear()
            .domain([0, 100])
            .rangeRound([height, 0]);

        let line = d3
            .line()
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
                state.area = area(state.values);
                state.line = line(state.values);
            });

        let governors = execs
            .filter(exec => exec.Position === 'Governor')
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
            });

        governors = d3.nest()
            .key((d) => d.state)
            .object(governors);

        return {
            states,
            governors,
            width,
            height
        };
    }
};
</script>

<style scoped>
.state {
    float: left;
    margin: 5px;
}
.state h4 {
    font-size: 15px;
    line-height: 15px;
}
svg {
    display: block;
    width: 100%;
    margin-top: 3px;
    border: 1px solid rgb(200,200,200);
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
rect {
    fill: #ff6480;
    /*
    stroke: black;
    stroke-width: 1px;*/
}
</style>
