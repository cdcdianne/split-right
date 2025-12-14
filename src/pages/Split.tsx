import { SplitProvider } from '@/context/SplitContext';
import { SplitFlow } from '@/components/split/SplitFlow';

const Split = () => {
  return (
    <SplitProvider>
      <SplitFlow />
    </SplitProvider>
  );
};

export default Split;
