
import {chunk} from 'lodash';
import * as React from 'react';

interface GridGeneratorProps {
    cols?: number;
    children: React.ReactNode;
}
type GridGeneratorType = React.FC<GridGeneratorProps>;


const GridGenerator: GridGeneratorType = ({ children, cols = 3 }) => {
    const rows = chunk(React.Children.toArray(children), cols);
    return (
        <div>
            {rows.map((row  , i) => (
                <div key={i} className="row">
                    {row.map((col, j) => (
                        <div key={j} className="col">
                            {col}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GridGenerator;