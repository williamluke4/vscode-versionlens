/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { formatWithExistingLeading } from '../../common/utils';
import {
  parseNpmRegistryVersion,
  parseFileVersion,
  parseGithubVersion
} from '../npm/npmPackageParser';
import * as PackageFactory from '../../common/packageGeneration';

const semver = require('semver');

const jspmDependencyRegex = /^(npm|github):(.*)@(.*)$/;
export function jspmPackageParser(node, appConfig) {
  const { name, value: version } = node;

  // check for supported package resgitries
  const regExpResult = jspmDependencyRegex.exec(version);
  if (!regExpResult) {
    return [{
      node,
      package: PackageFactory.createPackageNotSupported(name, version, 'jspm')
    }];
  }

  const packageManager = regExpResult[1];
  const extractedPkgName = regExpResult[2];
  const newPkgVersion = regExpResult[3];

  if (packageManager === 'github') {
    return parseGithubVersion(
      node,
      extractedPkgName,
      `${extractedPkgName}#${newPkgVersion}`,
      appConfig.githubTaggedCommits,
      customJspmGenerateVersion
    );
  }

  return parseNpmRegistryVersion(
    node,
    extractedPkgName,
    newPkgVersion,
    appConfig,
    customJspmGenerateVersion
  );
}

export function customJspmGenerateVersion(packageInfo, newVersion) {
  const existingVersion
  // test if the newVersion is a valid semver range
  // if it is then we need to use the commitish for github versions 
  if (packageInfo.meta.type === 'github' && semver.validRange(newVersion))
    existingVersion = packageInfo.meta.commitish
  else
    existingVersion = packageInfo.version

  // preserve the leading symbol from the existing version
  const preservedLeadingVersion = formatWithExistingLeading(existingVersion, newVersion)
  return `${packageInfo.meta.type}:${packageInfo.name}@${preservedLeadingVersion}`
}