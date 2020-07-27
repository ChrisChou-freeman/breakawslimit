'use strict'
const awsLimit = {
  // https://docs.aws.amazon.com/zh_cn/general/latest/gr/iot-core.html#1-click-throttling
  AcceptCertificateTransfer: 10,
  AddThingToBillingGroup: 60,
  AddThingToThingGroup: 60,
  AssociateTargetsWithJob: 10,
  AttachPolicy: 60,
  AttachPrincipalPolicy: 15,
  AttachThingPrincipal: 50,
  CancelCertificateTransfer: 10,
  CancelJob: 10,
  CancelJobExecution: 10,
  ClearDefaultAuthorizer: 10,
  CreateAuthorizer: 10,
  CreateBillingGroup: 25,
  CreateCertificateFromCsr: 15,
  CreateDynamicThingGroup: 5,
  CreateJob: 10,
  CreatePolicy: 60,
  CreatePolicyVersion: 10,
  CreateRoleAlias: 10,
  CreateThing: 15,
  CreateThingGroup: 25,
  CreateThingType: 15,
  DeleteAuthorizer: 10,
  DeleteBillingGroup: 15,
  DeleteCertificate: 50,
  DeleteCACertificate: 10,
  DeleteDynamicThingGroup: 5,
  DeleteJob: 10,
  DeleteJobExecution: 10,
  DeletePolicy: 60,
  DeletePolicyVersion: 10,
  DeleteRegistrationCode: 10,
  DeleteRoleAlias: 10,
  DeleteThing: 15,
  DeleteThingGroup: 15,
  DeleteThingType: 15,
  DeprecateThingType: 15,
  DescribeAuthorizer: 10,
  DescribeBillingGroup: 100,
  DescribeCertificate: 10,
  DescribeCACertificate: 10,
  DescribeDefaultAuthorizer: 10,
  DescribeJob: 10,
  DescribeJobExecution: 10,
  DescribeRoleAlias: 10,
  DescribeThing: 350,
  DescribeThingGroup: 100,
  DescribeThingType: 10,
  DetachThingPrincipal: 50,
  DetachPrincipalPolicy: 15,
  DetachPolicy: 60,
  GetEffectivePolicies: 50,
  GetJobDocument: 10,
  GetPolicy: 10,
  GetPolicyVersion: 15,
  GetRegistrationCode: 10,
  ListAttachedPolicies: 50,
  ListAuthorizers: 10,
  ListBillingGroups: 10,
  ListCACertificates: 10,
  ListCertificates: 10,
  ListChildThingGroups: 15,
  ListCertificatesByCA: 10,
  ListJobExecutionsForJob: 10,
  ListJobExecutionsForThing: 10,
  ListJobs: 10,
  ListOutgoingCertificates: 10,
  ListPolicies: 10,
  ListPolicyPrincipals: 10,
  ListPolicyVersions: 10,
  ListPrincipalPolicies: 15,
  ListPrincipalThings: 10,
  ListRoleAliases: 10,
  ListTagsForResource: 10,
  ListTargetsForPolicy: 50,
  ListThingGroups: 10,
  ListThingGroupsForThing: 10,
  ListThingPrincipals: 10,
  ListThings: 10,
  ListThingsInBillingGroup: 25,
  ListThingsInThingGroup: 25,
  ListThingTypes: 10,
  RegisterCertificate: 50,
  RegisterCACertificate: 10,
  RegisterThing: 10,
  RejectCertificateTransfer: 10,
  RemoveThingFromBillingGroup: 15,
  RemoveThingFromThingGroup: 15,
  SetDefaultAuthorizer: 10,
  SetDefaultPolicyVersion: 10,
  TagResource: 10,
  TestAuthorization: 10,
  TestInvokeAuthorizer: 10,
  TransferCertificate: 10,
  UntagResource: 10,
  UpdateAuthorizer: 10,
  UpdateBillingGroup: 15,
  UpdateCertificate: 50,
  UpdateCACertificate: 10,
  UpdateDynamicThingGroup: 5,
  UpdateJob: 10,
  UpdateRoleAlias: 10,
  UpdateThing: 10,
  UpdateThingGroup: 15
}

module.exports.awsLimit = awsLimit;
