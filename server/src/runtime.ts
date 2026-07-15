export function isServerlessRuntime(
  environment: Record<string, string | undefined> = process.env,
  workingDirectory = process.cwd(),
) {
  const normalizedWorkingDirectory = workingDirectory.replaceAll("\\", "/");

  return Boolean(
    environment.VERCEL === "1" ||
      environment.VERCEL === "true" ||
      environment.VERCEL_ENV ||
      environment.VERCEL_URL ||
      environment.LAMBDA_TASK_ROOT ||
      environment.AWS_LAMBDA_FUNCTION_NAME ||
      normalizedWorkingDirectory === "/var/task" ||
      normalizedWorkingDirectory.startsWith("/var/task/"),
  );
}
