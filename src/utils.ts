import { Cluster, clusterApiUrl } from "@_koi/web3.js";

export function k2ClusterApiUrl(cluster: Cluster, tls?: boolean) {
  const urlRegex =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

  if (urlRegex.test(cluster)) {
    return cluster;
  }

  return clusterApiUrl(cluster, tls);
}
