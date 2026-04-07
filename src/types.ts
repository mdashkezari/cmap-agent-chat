// App-local types (non-API).

export type ExampleItem = {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  category?: string;
  tags?: string[];
  expected_artifacts?: Array<"image" | "data" | string>;
};
