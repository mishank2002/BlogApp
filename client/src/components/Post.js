import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({_id, title, summary, cover, content, createdAt, author}) {
  const extractedContent = content.replace(/<[^>]+>/g, '');
  const first50Words = extractedContent.split(" ").slice(0, 30).join(" ");
  const remainingContent = extractedContent.split(" ").slice(30).join(" ");

  return (
    <div className="post">
      <div className="image">
        <Link to={`/post/${_id}`}>
          <img src={cover} alt=""/>
        </Link>
      </div>
      <div className="texts">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          <a className="author">{author.username}</a>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <div className="content">
          <p>{first50Words}</p>
          {remainingContent && (
            <Link to={`/post/${_id}`}>Read More</Link>
          )}
        </div>
      </div>
    </div>
  );
}
