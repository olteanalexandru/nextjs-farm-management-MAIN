"use client";

import { chunk } from 'lodash';
import * as React from 'react';

interface GridGeneratorProps {
    cols?: number;
    children: React.ReactNode;
}

const GridGenerator: React.FC<GridGeneratorProps> = ({ children, cols = 3 }) => {
    const rows = chunk(React.Children.toArray(children), cols);
    return (
        <div className="grid gap-4">
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {row.map((col, j) => (
                        <div key={j} className="w-full">
                            {col}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GridGenerator;
