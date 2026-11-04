export default function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      <span aria-hidden="true">{'★'.repeat(value)}</span>
      <span className="stars__off" aria-hidden="true">
        {'★'.repeat(5 - value)}
      </span>
    </span>
  );
}
