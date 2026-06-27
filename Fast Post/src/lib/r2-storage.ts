import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConfiguredValue, readLocalSettings } from "./local-settings";

export type R2UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type R2UploadResult = {
  storageKey: string;
  publicUrl: string;
};

export function isR2Configured(settings = readLocalSettings()) {
  return Boolean(
    getConfiguredValue("R2_ACCOUNT_ID", settings) &&
      getConfiguredValue("R2_ACCESS_KEY_ID", settings) &&
      getConfiguredValue("R2_SECRET_ACCESS_KEY", settings) &&
      getConfiguredValue("R2_BUCKET", settings) &&
      getConfiguredValue("R2_PUBLIC_BASE_URL", settings)
  );
}

export async function uploadToR2(input: R2UploadInput, settings = readLocalSettings()): Promise<R2UploadResult> {
  const accountId = getConfiguredValue("R2_ACCOUNT_ID", settings);
  const accessKeyId = getConfiguredValue("R2_ACCESS_KEY_ID", settings);
  const secretAccessKey = getConfiguredValue("R2_SECRET_ACCESS_KEY", settings);
  const bucket = getConfiguredValue("R2_BUCKET", settings);
  const publicBaseUrl = getConfiguredValue("R2_PUBLIC_BASE_URL", settings);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error("Cloudflare R2 nao esta configurado.");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType
    })
  );

  return {
    storageKey: input.key,
    publicUrl: new URL(input.key, ensureTrailingSlash(publicBaseUrl)).toString()
  };
}

export async function deleteFromR2(storageKey: string, settings = readLocalSettings()) {
  const accountId = getConfiguredValue("R2_ACCOUNT_ID", settings);
  const accessKeyId = getConfiguredValue("R2_ACCESS_KEY_ID", settings);
  const secretAccessKey = getConfiguredValue("R2_SECRET_ACCESS_KEY", settings);
  const bucket = getConfiguredValue("R2_BUCKET", settings);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Cloudflare R2 nao esta configurado.");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey
    })
  );
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}
