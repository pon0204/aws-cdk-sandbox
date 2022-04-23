import { Stack, StackProps, Tags, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_logs as logs,
  aws_servicediscovery as servicediscovery,
  aws_elasticloadbalancingv2 as elb,
} from 'aws-cdk-lib'

export class InfrastructureStack extends Stack {
  public readonly DDBTableName: string
  public readonly cluster: ecs.Cluster
  public readonly backendServiceSG: ec2.SecurityGroup
  public readonly frontendServiceSG: ec2.SecurityGroup
  public readonly targetGroup: elb.ApplicationTargetGroup
  public readonly cloudmapNamespace: servicediscovery.PrivateDnsNamespace
  public readonly backendTaskRole: iam.Role
  public readonly TaskExecutionRole: iam.Role
  public readonly frontendTaskRole: iam.Role
  public readonly backendLogGroup: logs.LogGroup
  public readonly frontendLogGroup: logs.LogGroup
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    })
    Tags.of(vpc).add('Name', 'CDKECSVPC')

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
    })

    const albSG = new ec2.SecurityGroup(this, 'ALBSG', {
      securityGroupName: 'ALBSG',
      vpc: vpc,
    })
    albSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))

    this.backendServiceSG = new ec2.SecurityGroup(this, 'BackendServiceSG', {
      securityGroupName: 'backendServiceSecurityGroup',
      vpc: vpc,
    })
    this.backendServiceSG.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.allTcp()
    )

    this.frontendServiceSG = new ec2.SecurityGroup(this, 'FrontendServiceSG', {
      securityGroupName: 'frontendServiceSecurityGroup',
      vpc: vpc,
    })
    this.frontendServiceSG.addIngressRule(albSG, ec2.Port.allTcp())

    this.cloudmapNamespace = new servicediscovery.PrivateDnsNamespace(
      this,
      'Namespace',
      {
        name: 'cdk.ecs.local',
        vpc: vpc,
      }
    )
    this.DDBTableName = 'my-dynamodb'
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'TodoId',
        type: dynamodb.AttributeType.NUMBER,
      },
      tableName: this.DDBTableName,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const ECSExecPolicyStatement = new iam.PolicyStatement({
      sid: 'allowECSExec',
      resources: ['*'],
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents',
      ],
    })

    this.backendTaskRole = new iam.Role(this, 'BackendTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })
    table.grantFullAccess(this.backendTaskRole)
    this.backendTaskRole.addToPolicy(ECSExecPolicyStatement)

    this.frontendTaskRole = new iam.Role(this, 'FrontendTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })
    this.frontendTaskRole.addToPolicy(ECSExecPolicyStatement)

    this.TaskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        {
          managedPolicyArn:
            'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        },
      ],
    })

    this.backendLogGroup = new logs.LogGroup(this, 'backendLogGroup', {
      logGroupName: 'myapp-backend',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.frontendLogGroup = new logs.LogGroup(this, 'frontendLogGroup', {
      logGroupName: 'myapp-frontend',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const alb = new elb.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSG,
      vpcSubnets: { subnets: vpc.publicSubnets },
    })

    const listener = alb.addListener('Listener', { port: 80 })

    this.targetGroup = listener.addTargets('targetGroup', {
      port: 80,
      protocol: elb.ApplicationProtocol.HTTP,
      healthCheck: {
        enabled: true,
        path: '/ishealthy',
        healthyHttpCodes: '200,301',
      },
    })
  }
}
