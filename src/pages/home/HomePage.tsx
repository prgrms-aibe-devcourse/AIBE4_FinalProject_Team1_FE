type Props = {
  title: string;
};

export default function HomePage({ title }: Props) {
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
