module.exports.dockerLifecyclePolicyKeepTen = serverless => {
  return JSON.stringify({
    rules: [
      {
        action: { type: 'expire' },
        rulePriority: 1,
        description: `Remove older ${serverless.options.stage} images`,
        selection: {
          tagStatus: 'tagged',
          tagPrefixList: [`${serverless.options.stage}-`],
          countType: 'imageCountMoreThan',
          countNumber: 10,
        },
      },
    ],
  });
};
