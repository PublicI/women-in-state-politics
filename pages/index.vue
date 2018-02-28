<template>
    <div class="states">
        <div v-for="(state,name) in states" class="state">
            <h4>{{name}}</h4>

            <svg :width="width" :height="height">
                <path :d="state.d" />
            </svg>
        </div>
    </div>
</template>

<script>
import seats from '~/assets/seats.csv';
import * as d3 from 'd3';
import groupby from 'lodash.groupby';

export default {
    data() {
        let width = 100;
        let height = 400;

        let records = seats.map((d) => {
            return {
                state: d.State,
                year: parseInt(d.Year),
                percent: parseFloat(d['Total % Women'])
            };
        });

        let x = d3.scaleLinear()
            .rangeRound([0, width]);

        x.domain(d3.extent(records, (d) => d.year));

        let y = d3.scaleLinear()
            .domain([0, 100])
            .rangeRound([height, 0]);

        let line = d3.line()
            .x((d) => x(d.year))
            .y((d) => y(d.percent));

        let area = d3.area()
            .x((d) => x(d.year))
            .y1((d) => y(d.percent));

        area.y0(y(0));

        let states = groupby(records, 'state');

        Object.keys(states).forEach((key) => {
            let state = states[key];
            state.d = area(state);
        });

        return {
            states,
            width,
            height
        };
    },
    mounted() {

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
    border: 1px solid rgb(200,200,200);
}
svg path {
    fill: pink;
    /* stroke: black; */
    stroke-width: 1px;
}
.states:after {
    content: "";
    display: table;
    clear: both;
}
</style>
