
import React from 'react';
import Reports from './Reports';

// Since the functionality has been merged into Reports.tsx, this component acts as a redirect or wrapper.
// In the current App structure, SummonPage isn't used directly in the main tabs anymore (it's part of Reports Center).
// If it is used standalone, we render Reports with the active tab set to 'summon'.

const SummonPage: React.FC = () => {
  return (
    <div className="w-full">
        {/* We reuse the Reports component because it contains the fixed PDF logic */}
        <Reports />
    </div>
  );
};

export default SummonPage;
