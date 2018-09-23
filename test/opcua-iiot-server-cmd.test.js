/**
 * Original Work Copyright 2014 IBM Corp.
 * node-red
 *
 * Copyright (c) 2018 Klaus Landsdorf (http://bianco-royal.de/)
 * All rights reserved.
 * node-red-contrib-iiot-opcua
 *
 **/

'use strict'

jest.setTimeout(10000)

var injectNode = require('node-red/nodes/core/core/20-inject')
var injectOPCUANode = require('../src/opcua-iiot-inject')
var inputNode = require('../src/opcua-iiot-server-cmd')
var serverNode = require('../src/opcua-iiot-server')

var helper = require('node-red-node-test-helper')
helper.init(require.resolve('node-red'))

var testCMDFlow = [
  {
    'id': 'n1cmdf1',
    'type': 'inject',
    'payload': 'testpayload',
    'payloadType': 'str',
    'repeat': '',
    'crontab': '',
    'once': true,
    'wires': [['n2cmdf1', 'n3cmdf1', 'n4cmdf1']]
  },
  {id: 'n2cmdf1', type: 'helper'},
  {
    'id': 'n3cmdf1',
    'type': 'OPCUA-IIoT-Server-Command',
    'commandtype': 'restart',
    'nodeId': '',
    'name': '',
    'wires': [
      ['n5cmdf1']
    ]
  },
  {
    'id': 'n4cmdf1',
    'type': 'OPCUA-IIoT-Server-Command',
    'commandtype': 'deleteNode',
    'nodeId': 'ns=1;s=TestFolder',
    'name': '',
    'wires': [
      ['n6cmdf1']
    ]
  },
  {id: 'n5cmdf1', type: 'helper'},
  {id: 'n6cmdf1', type: 'helper'}
]

var testInjectCMDFlow = [
  {
    'id': 'n1cmdf2',
    'type': 'OPCUA-IIoT-Inject',
    'injectType': 'inject',
    'payload': 'testpayload',
    'payloadType': 'str',
    'topic': 'TestTopicCMD',
    'repeat': '',
    'crontab': '',
    'once': true,
    'startDelay': '1',
    'name': 'TestName',
    'addressSpaceItems': [
      {
        'name': 'TestFolder',
        'nodeId': 'ns=1;s=TestFolder',
        'datatypeName': ''
      }
    ],
    'wires': [['n2cmdf2', 'n3cmdf2']]
  },
  {id: 'n2cmdf2', type: 'helper'},
  {
    'id': 'n3cmdf2',
    'type': 'OPCUA-IIoT-Server-Command',
    'commandtype': 'deleteNode',
    'nodeId': '',
    'name': '',
    'wires': [
      ['n4cmdf2', 's1cf5']
    ]
  },
  {id: 'n4cmdf2', type: 'helper'},
  {
    'id': 's1cf5',
    'type': 'OPCUA-IIoT-Server',
    'port': '1998',
    'endpoint': '',
    'acceptExternalCommands': true,
    'maxAllowedSessionNumber': '',
    'maxConnectionsPerEndpoint': '',
    'maxAllowedSubscriptionNumber': '',
    'alternateHostname': '',
    'name': 'TestServer',
    'showStatusActivities': false,
    'showErrors': false,
    'asoDemo': true,
    'allowAnonymous': true,
    'isAuditing': false,
    'serverDiscovery': true,
    'users': [],
    'xmlsets': [],
    'publicCertificateFile': '',
    'privateCertificateFile': '',
    'maxNodesPerRead': 1000,
    'maxNodesPerBrowse': 2000,
    'wires': [['n5cmdf2']]
  },
  {id: 'n5cmdf2', type: 'helper'}
]

describe('OPC UA Server Command node Testing', function () {
  beforeAll(function (done) {
    helper.startServer(function () {
      done()
    })
  })

  afterEach(function (done) {
    helper.unload().then(function () {
      done()
    }).catch(function () {
      done()
    })
  })

  afterAll(function (done) {
    helper.stopServer(function () {
      done()
    })
  })

  describe('Command node', function () {
    it('should be loaded', function (done) {
      helper.load(
        [inputNode],
        [{
          'id': 'n3cmdf1',
          'type': 'OPCUA-IIoT-Server-Command',
          'commandtype': 'restart',
          'nodeId': '',
          'name': 'TestName',
          'wires': [[]]
        }
        ],
        function () {
          let nodeUnderTest = helper.getNode('n3cmdf1')
          expect(nodeUnderTest.name).toBe('TestName')
          expect(nodeUnderTest.commandtype).toBe('restart')
          expect(nodeUnderTest.nodeId).toBe('')
          done()
        })
    })

    it('should get a message with payload on restart command', function (done) {
      helper.load([injectNode, inputNode], testCMDFlow, function () {
        let n5 = helper.getNode('n5cmdf1')
        n5.on('input', function (msg) {
          expect(msg.payload.commandtype).toBe('restart')
          expect(msg.payload.nodeId).toBe('')
          expect(msg.nodetype).toBe('CMD')
          done()
        })
      })
    })

    it('should get a message with payload on delete ASO command', function (done) {
      helper.load([injectNode, inputNode], testCMDFlow, function () {
        let n6 = helper.getNode('n6cmdf1')
        n6.on('input', function (msg) {
          expect(msg.payload.commandtype).toBe('deleteNode')
          expect(msg.payload.nodeId).toBe('ns=1;s=TestFolder')
          expect(msg.nodetype).toBe('CMD')
          done()
        })
      })
    })

    it('should get a message with inject to delete ASO', function (done) {
      helper.load([injectOPCUANode, inputNode, serverNode], testInjectCMDFlow, function () {
        let n4 = helper.getNode('n4cmdf2')
        n4.on('input', function (msg) {
          expect(msg.payload.commandtype).toBe('deleteNode')
          expect(msg.payload.nodeId).toBe('ns=1;s=TestFolder')
          expect(msg.nodetype).toBe('CMD')
          done()
        })
      })
    })
  })
})
