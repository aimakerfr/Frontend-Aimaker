import * as React from 'react';

const AssemblerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#4F8DFD"/>
    <rect x="12" y="2" width="6" height="6" rx="1.5" fill="#4F8DFD"/>
    <rect x="2" y="12" width="6" height="6" rx="1.5" fill="#4F8DFD"/>
    <rect x="12" y="12" width="6" height="6" rx="1.5" fill="#4F8DFD"/>
  </svg>
);

export default AssemblerIcon;
