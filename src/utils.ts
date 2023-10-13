import { Cluster, clusterApiUrl } from "@_koi/web3.js";

export function k2ClusterApiUrl(cluster: Cluster, tls?: boolean) {
  const urlRegex =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

  if (urlRegex.test(cluster)) {
    return cluster;
  }

  if (cluster === "testnet") {
    return "https://testnet.koii.live";
  }

  return clusterApiUrl(cluster, tls);
}
