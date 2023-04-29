module.exports.StagingCertificate = async ({ resolveVariable }) => {
  return await GlobalStageCertificate({ resolveVariable }, "staging");
};

module.exports.LiveCertificate = async ({ resolveVariable }) => {
  return await GlobalStageCertificate({ resolveVariable }, "live");
};

module.exports.LiveTempCertificate = async ({ resolveVariable }) => {
  return await GlobalStageCertificate({ resolveVariable }, "livetemp");
};

const GlobalStageCertificate = async ({ resolveVariable }, stage) => {
  const zoneId = await fetchZoneId(
    { resolveVariable },
    `self:custom.${stage}DnsZoneId`
  );
  const pubDomainName = await resolveVariable(`self:custom.${stage}PubDomain`);
  const draftDomainName = await resolveVariable(
    `self:custom.${stage}DraftDomain`
  );
  const apexDomainName = await resolveVariable(
    `self:custom.${stage}ApexDomain`
  );
  const alternateDomains = [draftDomainName, pubDomainName];
  const validatedDomains = zoneId && [
    buildDomainValidation(apexDomainName, zoneId),
    buildDomainValidation(pubDomainName, zoneId),
    buildDomainValidation(draftDomainName, zoneId),
  ];
  return buildCert(
    { resolveVariable },
    apexDomainName,
    alternateDomains,
    validatedDomains
  );
};

module.exports.LoadBalancerCertificate = async ({ resolveVariable }) => {
  const dnsZoneId = await fetchZoneId(
    { resolveVariable },
    "self:custom.dnsZoneId"
  );
  const pubDomainName = await resolveVariable("self:custom.pubDomain");
  const draftDomainName = await resolveVariable("self:custom.draftDomain");
  const apexDomainName = await resolveVariable("self:custom.apexDomain");
  const alternateDomains = [pubDomainName, draftDomainName];
  const validationDomains = dnsZoneId && [
    buildDomainValidation(apexDomainName, dnsZoneId),
    buildDomainValidation(pubDomainName, dnsZoneId),
    buildDomainValidation(draftDomainName, dnsZoneId),
  ];
  return buildCert(
    { resolveVariable },
    apexDomainName,
    alternateDomains,
    validationDomains
  );
};

const buildCert = async (
  { resolveVariable },
  primaryDomain,
  alternateDomains,
  validatedDomains
) => {
  const projectTag = await resolveVariable("self:custom.project");
  const cert = {
    Type: "AWS::CertificateManager::Certificate",
    Properties: {
      DomainName: primaryDomain,
      SubjectAlternativeNames: alternateDomains,
      Tags: [{ Key: "project", Value: projectTag }],
      ValidationMethod: "DNS",
    },
  };
  if (validatedDomains)
    cert.Properties.DomainValidationOptions = validatedDomains;
  return cert;
};

const fetchZoneId = async ({ resolveVariable }, varString) => {
  try {
    return await resolveVariable(varString);
  } catch (err) {
    return undefined;
  }
};

const buildDomainValidation = (domainName, zoneId) => {
  return zoneId
    ? { DomainName: domainName, HostedZoneId: zoneId }
    : { DomainName: domainName };
};
