import React, { useState, useEffect } from 'react';
import { DistributionType, getVariantDistributionData } from '../services/api';
import { Plot } from '../components/Plot';
import { InternationalTimeDistributionEntry, ValueWithCI } from '../services/api-types';
import { SampleSelectorSchema } from '../helpers/sample-selector';
import { Widget } from './Widget';
import * as zod from 'zod';
import { ZodQueryEncoder } from '../helpers/query-encoder';

const digitsForPercent = (v: number): string => (v * 100).toFixed(2);

const valueToString = (v: ValueWithCI): string => `${digitsForPercent(v.value)}%`;

const PropsSchema = SampleSelectorSchema.merge(
  zod.object({
    logScale: zod.boolean().optional(),
  })
);
type Props = zod.infer<typeof PropsSchema>;

const VariantInternationalComparisonPlot = ({ country, mutations, matchPercentage, logScale }: Props) => {
  const [plotData, setPlotData] = useState<InternationalTimeDistributionEntry[] | undefined>(undefined);
  const [colorMap, setColorMap] = useState<any>(null);

  useEffect(() => {
    let isSubscribed = true;
    const controller = new AbortController();
    const signal = controller.signal;
    getVariantDistributionData(
      DistributionType.International,
      country,
      mutations,
      matchPercentage,
      signal
    ).then(newDistributionData => {
      if (isSubscribed) {
        const countriesToPlot = new Set(['United Kingdom', 'Denmark', 'Switzerland', country]);
        const newPlotData = newDistributionData.filter((d: any) => countriesToPlot.has(d.x.country));
        // TODO Remove hard-coding..
        const newColorMap = [
          { target: 'United Kingdom', value: { marker: { color: 'black' } } },
          { target: 'Denmark', value: { marker: { color: 'green' } } },
          { target: 'Switzerland', value: { marker: { color: 'red' } } },
        ];
        if (country && !['United Kingdom', 'Denmark', 'Switzerland'].includes(country)) {
          newColorMap.push({
            target: country,
            value: { marker: { color: 'blue' } },
          });
        }
        setColorMap(newColorMap);
        setPlotData(newPlotData);
      }
    });
    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [country, mutations, matchPercentage]);

  return (
    <div style={{ height: '100%' }}>
      {!plotData && <p>Loading...</p>}
      {plotData && (
        <Plot
          style={{ width: '100%', height: '100%' }}
          data={[
            {
              type: 'scatter',
              mode: 'lines+markers',
              x: plotData.map(d => d.x.week.firstDayInWeek),
              y: plotData.map(d => digitsForPercent(d.y.proportion.value)),
              text: plotData.map(d => valueToString(d.y.proportion)),
              transforms: [
                {
                  type: 'groupby',
                  groups: plotData.map(d => d.x.country),
                  styles: colorMap,
                  nameformat: '%{group}',
                },
              ],
              hovertemplate: '%{text}',
            },
          ]}
          layout={{
            title: '',
            xaxis: {
              title: 'Week',
              type: 'date',
              tickvals: plotData.map(d => d.x.week.firstDayInWeek),
              tickformat: 'W%-V, %Y',
              hoverformat: 'Week %-V, %Y (from %d.%m.)',
            },
            yaxis: {
              title: 'Estimated Percentage',
              type: logScale ? 'log' : 'linear',
            },
            legend: {
              x: 0,
              xanchor: 'left',
              y: 1,
            },
            margin: { t: 10 },
          }}
          config={{
            displaylogo: false,
            modeBarButtons: [['zoom2d', 'toImage', 'resetScale2d', 'pan2d']],
            responsive: true,
          }}
        />
      )}
    </div>
  );
};

export const VariantInternationalComparisonPlotWidget = new Widget(
  new ZodQueryEncoder(PropsSchema),
  VariantInternationalComparisonPlot,
  'VariantInternationalComparisonPlot'
);
