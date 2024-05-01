import Link from 'next/link';

function Continut({ data }: { data: any }): JSX.Element {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-grow">
                <h1>{data.title}</h1>
                {data.brief.length > 400 ? (
                    <p>{data.brief.slice(0, 400)}...</p>
                ) : (
                    <p>{data.brief}</p>
                )}
            </div>
            <div className="mt-auto">
                <Link href={`/Crud/GetAllPosts/SinglePost?post=${data._id}`}>
                    <button type="button" className="btn btn-primary">See article</button>
                </Link>
            </div>
        </div>
    );
}

export default Continut;

