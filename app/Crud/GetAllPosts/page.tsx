import Link from 'next/link';

function Continut({ data }: { data: any }): JSX.Element {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-grow">
                <h1>{data.title}</h1>
                <p>{data.description}</p>
            </div>
            <div className="mt-auto">
                <Link href={`/Crud/GetAllPosts/SinglePost?post=${data._id}`}>
                    <button type="button" className="btn btn-primary">See more</button>
                </Link>
            </div>
        </div>
    );
}

export default Continut;

