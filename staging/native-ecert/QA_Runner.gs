/**
 * QA editor-only wrappers for parameterised functions.
 * These wrappers NEVER send emails. Run only in a separate QA Apps Script project.
 * Configure EC_QA_TEST_BATCH and EC_QA_TEST_RECEIPT in Script Properties.
 */
function ecQaCloseConfiguredBatch() {
  const batch=Number(PropertiesService.getScriptProperties().getProperty('EC_QA_TEST_BATCH'));
  if (![1,2].includes(batch)) throw new Error('Set EC_QA_TEST_BATCH to 1 or 2.');
  return ecCloseBatchQa(batch);
}
function ecQaApproveConfiguredReceipt() {
  const receipt=PropertiesService.getScriptProperties().getProperty('EC_QA_TEST_RECEIPT');
  if (!/^QA-[A-Z0-9_-]+$/i.test(String(receipt||''))) throw new Error('Set a synthetic QA receipt.');
  return ecApproveQa(receipt);
}
function ecQaGenerateConfiguredReceipt() {
  const receipt=PropertiesService.getScriptProperties().getProperty('EC_QA_TEST_RECEIPT');
  if (!/^QA-[A-Z0-9_-]+$/i.test(String(receipt||''))) throw new Error('Set a synthetic QA receipt.');
  return ecGenerateQa(receipt);
}
