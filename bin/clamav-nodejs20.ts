#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ClamavNodejs20Stack } from "../lib/clamav-nodejs20-stack";

const app = new cdk.App();
new ClamavNodejs20Stack(app, "ClamavNodejs20Stack", {});
