#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { WorkshopStack } from '../lib/workshop-stack'

const app = new cdk.App()
new WorkshopStack(app, 'WorkshopStack')
