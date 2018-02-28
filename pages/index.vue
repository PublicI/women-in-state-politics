<template>
    <div class="states">
        <div v-for="state in states" class="state">
            <h4>{{state.key}}</h4>

            <svg :width="width" :height="height">
                <path :d="state.d" />
            </svg>
        </div>
    </div>
</template>

<script>
import seats from '~/assets/seats.csv';
import * as d3 from 'd3';

export default {
    data() {
        let width = 100;
        let height = 200;

        let records = seats.map((d) => {
            return {
                state: d.State,
                year: parseInt(d.Year),
                percent: parseFloat(d['Total % Women'])
            };
        }).sort((a, b) => a.year - b.year);

        let x = d3.scaleLinear()
            .rangeRound([-1, width - 1]);

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

        // let states = topairs(groupby(records, 'state'));

        let states = d3.nest()
            .key((d) => d.state)
            .entries(records);

        states
            .sort((a, b) => b.values[b.values.length - 1].percent - a.values[a.values.length - 1].percent)
            .forEach((state) => {
                state.d = area(state.values);
            });

        return {
            states,
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
    border: 1px solid rgb(200,200,200);
}
svg path {
    fill: pink;
    /* fill: none; */
    stroke: black;
    stroke-width: 1px;
}
.states:after {
    content: "";
    display: table;
    clear: both;
}
</style>
