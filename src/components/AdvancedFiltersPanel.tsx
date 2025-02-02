import { ExternalLink } from './ExternalLink';
import { useCallback, useState } from 'react';
import { qcFieldsAndLabels, QcSelector } from '../data/QcSelector';
import { Utils } from '../services/Utils';
import { Button, ButtonVariant } from '../helpers/ui';
import { useExploreUrl } from '../helpers/explore-url';
import Select from 'react-select';
import { HostSelector } from '../data/HostSelector';
import { HostService } from '../services/HostService';
import { useQuery } from '../helpers/query-hook';
import Loader from './Loader';
import { HUMAN } from '../data/api-lapis';

type Props = {
  onClose: () => void;
};

const toSelectOption = (s: string) => ({ label: s, value: s });

export const AdvancedFiltersPanel = ({ onClose }: Props) => {
  const { setHostAndQc, host: initialHost, qc: initialQc } = useExploreUrl() ?? {};
  const [host, setHost] = useState<HostSelector>(initialHost ?? []);
  const [qc, setQc] = useState<QcSelector>(initialQc ?? {});

  const { data: allHosts } = useQuery(
    () => HostService.allHosts.then(hs => hs.sort((a, b) => a.localeCompare(b))),
    []
  );

  const setQcValue = useCallback(
    (field, valueString?: string) => {
      setQc(prev => ({
        ...prev,
        [field]: Utils.safeParseInt(valueString),
      }));
    },
    [setQc]
  );

  const changeHostSelect = useCallback((selected: ReadonlyArray<{ label: string; value: string }>) => {
    setHost(selected.map(option => option.value));
  }, []);

  const save = useCallback(() => {
    if (!setHostAndQc) {
      return;
    }
    setHostAndQc(host, qc);
    onClose();
  }, [host, qc, setHostAndQc, onClose]);

  return (
    <>
      {/* Hosts */}
      <h2>Hosts</h2>
      {allHosts ? (
        <>
          <button className='underline cursor-pointer mr-2' onClick={() => setHost(allHosts)}>
            Select all
          </button>
          {' | '}
          <button className='underline cursor-pointer ml-2' onClick={() => setHost([HUMAN])}>
            Select human
          </button>
          {' | '}
          <button
            className='underline cursor-pointer ml-2'
            onClick={() => setHost(allHosts.filter(h => h !== HUMAN))}
          >
            Select non-human
          </button>
          <Select
            isMulti
            closeMenuOnSelect={false}
            options={allHosts.map(toSelectOption)}
            value={host.map(toSelectOption)}
            placeholder='Select hosts...'
            onChange={changeHostSelect}
            className='mt-2'
          />
          <div className='mt-2'>By default, only sequences obtained from human hosts are used.</div>
        </>
      ) : (
        <div style={{ height: 200 }}>
          <Loader />
        </div>
      )}
      {/* Sequence quality */}
      <h2>Sequence quality</h2>
      Here, you can filter the sequences by the QC (quality control) metrics calculated by{' '}
      <ExternalLink url='https://clades.nextstrain.org/'>Nextclade</ExternalLink>. In general, 0 to 29 is
      considered as good, 30 to 99 is mediocre, and over 100 is bad. For more information, please check out{' '}
      <ExternalLink url='https://docs.nextstrain.org/projects/nextclade/en/latest/user/algorithm/07-quality-control.html'>
        Nextclade's documentation
      </ExternalLink>
      .
      <div>
        <button className='underline cursor-pointer mr-2' onClick={() => setQc({})}>
          Select all
        </button>
        {' | '}
        <button
          className='underline cursor-pointer mr-2'
          onClick={() => setQc({ nextcladeQcOverallScoreTo: 29 })}
        >
          Select good
        </button>
        {' | '}
        <button
          className='underline cursor-pointer mr-2'
          onClick={() => setQc({ nextcladeQcOverallScoreTo: 99 })}
        >
          Select good and mediocre
        </button>
        {' | '}
        <button
          className='underline cursor-pointer mr-2'
          onClick={() => setQc({ nextcladeQcOverallScoreFrom: 100 })}
        >
          Select only bad
        </button>
      </div>
      {qcFieldsAndLabels.map(({ label, fromField, toField }) => (
        <div className='py-2' key={label}>
          {label}:{' '}
          <input
            className='border w-24'
            type='number'
            value={qc[fromField] ?? ''}
            onChange={e => setQcValue(fromField, e.target.value)}
          />{' '}
          -{' '}
          <input
            className='border w-24'
            type='number'
            value={qc[toField] ?? ''}
            onChange={e => setQcValue(toField, e.target.value)}
          />
        </div>
      ))}
      {/* Save */}
      <Button variant={ButtonVariant.SECONDARY} className='w-full mt-2' onClick={save}>
        Save
      </Button>
    </>
  );
};
