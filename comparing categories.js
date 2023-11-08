

window.onload = function () {

    // var margin = 0;
    // var x, y, svg = 0;
    // setRanges()

    getData('Albuquerque')

    var cities = ['Albuquerque', 'Anaheim', 'Arlington', 'Atlanta', 'Aurora', 'Austin', 'Baltimore', 'Boston', 'Buffalo', 'CapeCoral', 'ColoradoSprings', 'Columbus', 'Dallas', 'Denver', 'DesMoines', 'Detroit', 'Durham', 'Fresno', 'GardenGrove', 'GrandRapids', 'Greensboro', 'Honolulu', 'Houston', 'HuntingtonBeach', 'Indianapolis', 'Irvine', 'Jerseycity', 'Knoxville', 'LasVegas', 'LosAngeles', 'Louisville', 'Madison', 'Miami', 'Milwaukee', 'Minneapolis', 'Nashville', 'NewOrleans', 'NewYork', 'Oakland', 'OklahomaCity', 'Ontario', 'Orlando', 'OverlandPark', 'Phoenix', 'Pittsburgh', 'Plano', 'Portland', 'Providence', 'RanchoCucamonga', 'Richmond', 'Rochester', 'Sacramento', 'SanDiego', 'SanFrancisco', 'SanJose', 'SantaRosa', 'Seattle', 'SiouxFalls', 'StLouis', 'Stockton', 'Tampa', 'WashingtonDC', 'Worcester'];

    var citySelect = document.getElementById('citySelect');

    for (var i = 0; i < cities.length; i++) {
        var option = document.createElement('option');
        option.value = cities[i];
        option.textContent = cities[i];
        citySelect.appendChild(option);
    }

    citySelect.addEventListener('change', function (e) {
        var selectedCity = e.target.value;
        console.log('Selected city:', selectedCity);
        // You can perform any further actions with the selected city here
        d3.select("#container").select("svg").remove();
        d3.select('#container').append("svg");
        getData(selectedCity)
    });
};


function getData(filename) {
    console.log('Selected city:', filename);

    

    d3.csv("Data/" + filename + "_Final_2022-06-18.csv").then(function (data) {


        data = data.filter(function (d) {
            return d.scientific_name !== "NA";
        });

        // Format data
        data.forEach(function (d) {
            d.amounts = +d.amounts;
        });

        // Group data by scientific_name and calculate count for each group
        var nestedData = Array.from(d3.group(data, d => d.scientific_name), ([key, values]) => ({ key, count: values.length }));

        // Sort the nestedData by count in descending order
        nestedData.sort(function (a, b) {
            return b.count - a.count;
        });
        
        let totalCount = 0;

        for (let i = 0; i < nestedData.length; i++) {
            totalCount += nestedData[i].count;
        }
    
        const svg = d3.select('svg');
        const svgContainer = d3.select('#container');
      
        const margin = 80;
        const width = 1000 - 2 * margin;
        const height = 600 - 2 * margin;
  
        const chart = svg.append('g')
            .attr('transform', `translate(${margin}, ${margin})`);

        nestedData = nestedData.slice(0,5);

        console.log(nestedData);
  
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(nestedData.map((s) => s.key))
            .padding(0.4);
      
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 100]);
  
        const makeYLines = () => d3.axisLeft()
            .scale(yScale);
  
        chart.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));
  
        chart.append('g')
            .call(d3.axisLeft(yScale));
  
        chart.append('g')
            .attr('class', 'grid')
            .call(makeYLines()
                .tickSize(-width, 0, 0)
                .tickFormat('')
            );
  
        const barGroups = chart.selectAll()
            .data(nestedData)
            .enter()
            .append('g');
  
        barGroups
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (g) => xScale(g.key))
            .attr('y', (g) => yScale((g.count/totalCount)*100))
            .attr('height', (g) => height - yScale((g.count/totalCount)*100))
            .attr('width', xScale.bandwidth())
            .on('mouseenter', function (actual, i) {
                d3.selectAll('.value')
                    .attr('opacity', 0);

                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 0.6)
                    .attr('x', (a) => xScale(a.key) - 5)
                    .attr('y', (a) => yScale((a.count/totalCount)*100))
                    .attr('width', xScale.bandwidth() + 10);

                console.log(actual)
                console.log(i)

                const y = yScale((i.count/totalCount)*100);

                chart.append('line')
                    .attr('id', 'limit')
                    .attr('x1', 0)
                    .attr('y1', y)
                    .attr('x2', width)
                    .attr('y2', y);

                barGroups.append('text')
                    .attr('class', 'divergence')
                    .attr('x', (a) => xScale(a.key) + xScale.bandwidth() / 2)
                    .attr('y', (a) => yScale((a.count/totalCount)*100) + 15)
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .text((a, idx) => {
                        const divergence = ((a.count/totalCount)*100 - (i.count/totalCount)*100).toFixed(1);
                        let text = 'n: ' +a.count+' ' ;
                        if (divergence > 0) text += '+';
                        text += `${divergence}%`;
                        return idx !== i ? text : '';
                    });
            })
            .on('mouseleave', function () {
                d3.selectAll('.value')
                    .attr('opacity', 1);

                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 1)
                    .attr('width', xScale.bandwidth());

                chart.selectAll('#limit').remove();
                chart.selectAll('.divergence').remove();
            });

        barGroups
            .append('text')
            .attr('class', 'value')
            .attr('x', (a) => xScale(a.key) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale((a.count/totalCount)*100) + 15)
            .attr('text-anchor', 'middle')
            .text((a) => `${((a.count/totalCount)*100).toFixed(1)}%`);

        svg
            .append('text')
            .attr('class', 'label')
            .attr('x', -(height / 2) - margin)
            .attr('y', margin / 2.4)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('Percentage');

        svg.append('text')
            .attr('class', 'label')
            .attr('x', width / 2 + margin)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Top 10 Species by Count');

        svg.append('text')
            .attr('class', 'source')
            .attr('x', width - margin / 2)
            .attr('y', height + margin * 1.7)
            .attr('text-anchor', 'start')
            .text('Source: Data');

        // svg.append('text')
        //     .attr('class', 'title')
        //     .attr('x', width / 2 + margin)
        //     .attr('y', 40)
        //     .attr('text-anchor', 'middle')
        //     .text('Top 10 Species by Count');
    });
}
