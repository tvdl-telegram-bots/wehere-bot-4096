import PackageJson from "../../package.json";

export default function Route() {
  return <pre>{JSON.stringify(PackageJson, null, 2)}</pre>;
}
