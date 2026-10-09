const SectionHeading = ({
  eyebrow,
  title,
  description,
  actionText,
  actionHref = "/shop",
}) => {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            {eyebrow}
          </p>
        )}

        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-2xl text-gray-600">
            {description}
          </p>
        )}
      </div>

      {actionText && (
        <a
          href={actionHref}
          className="text-sm font-semibold text-gray-900 underline underline-offset-4 transition hover:text-gray-500"
        >
          {actionText}
        </a>
      )}
    </div>
  );
};

export default SectionHeading;