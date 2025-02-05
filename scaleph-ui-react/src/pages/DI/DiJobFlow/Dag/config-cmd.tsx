import { createCmdConfig, DisposableCollection, IApplication, NsEdgeCmd, NsGraph, NsNodeCmd, uuidv4, XFlowEdgeCommands, XFlowGraphCommands } from '@antv/xflow'
// import { MockApi } from './service'
import { commandContributions } from './cmd-extensions'
import { CONNECTION_PORT_TYPE, DND_RENDER_ID, NODE_HEIGHT, NODE_WIDTH } from './constant'
import { XFlowEdge } from '@antv/xflow-extension/es/canvas-dag-extension/x6-extension/edge';
import { XFlowNode } from '@antv/xflow-extension/es/canvas-dag-extension/x6-extension/node';
import { NsAddEdgeEvent } from './config-graph';
import { DagService } from './service';
import { DiJob } from '@/services/project/typings';

export const useCmdConfig = createCmdConfig(config => {
  // 注册全局Command扩展
  config.setCommandContributions(() => commandContributions)
  // 设置hook
  config.setRegisterHookFn(hooks => {
    const list = [
      hooks.graphMeta.registerHook({
        name: 'get graph meta',
        handler: async args => {
        },
      }),
      hooks.saveGraphData.registerHook({
        name: 'save graph data',
        handler: async args => {
          if (!args.saveGraphDataService) {
            args.saveGraphDataService = DagService.saveGraphData
          }
        },
      }),
      hooks.addNode.registerHook({
        name: 'add node',
        handler: async args => {
          const cellFactory: NsNodeCmd.AddNode.IArgs['cellFactory'] = async nodeConfig => {
            const node = new XFlowNode({
              ...nodeConfig,
            })
            return node
          }
          args.cellFactory = cellFactory;
          args.createNodeService = async args => {
            const { id } = args.nodeConfig;
            const nodeId = id || uuidv4();
            const node: NsNodeCmd.AddNode.IArgs['nodeConfig'] = {
              ...args.nodeConfig,
              id: nodeId,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
              renderKey: DND_RENDER_ID,
              ports: createPorts(args.nodeConfig.data.type),
            }
            return node;
          }
        },
      }),
      hooks.addEdge.registerHook({
        name: 'dag-add-edge',
        handler: async args => {
          const cellFactory: NsEdgeCmd.AddEdge.IArgs['cellFactory'] = async edgeConfig => {
            const cell = new XFlowEdge({
              ...edgeConfig,
              id: edgeConfig.id,
              source: {
                cell: edgeConfig.source,
                port: edgeConfig.sourcePortId,
              },
              target: {
                cell: edgeConfig.target,
                port: edgeConfig.targetPortId,
              },
              data: { ...edgeConfig },
            })
            return cell
          }
          args.cellFactory = cellFactory
        },
      }),
      hooks.afterGraphInit.registerHook({
        name: 'call add edge to replace temp edge',
        handler: async handlerArgs => {
          const { commandService, graph } = handlerArgs
          graph.on(NsAddEdgeEvent.EVENT_NAME, (args: NsAddEdgeEvent.IArgs) => {
            commandService.executeCommand(XFlowEdgeCommands.ADD_EDGE.id, {
              edgeConfig: {
                id: uuidv4(),
                source: args.source,
                target: args.target,
                sourcePortId: args.sourcePortId,
                targetPortId: args.targetPortId,
              }
            } as NsEdgeCmd.AddEdge.IArgs)
            args.edge.remove()
          })
        },
      }),
      hooks.addEdge.registerHook({
        name: 'get edge config from backend api',
        handler: async args => {
          args.createEdgeService = async args => {
            const { edgeConfig } = args;
            return edgeConfig
          }
        },
      }),
    ]
    const toDispose = new DisposableCollection()
    toDispose.pushAll(list)
    return toDispose
  })
})

export const createPorts = (type: string) => {
  const group = {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#31d0c6',
          strokeWidth: 2,
          fill: '#fff',
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#31d0c6',
          strokeWidth: 2,
          fill: '#fff',
        },
      },
    },
  };
  if (type === 'source') {
    const items: NsGraph.INodeAnchor[] = [
      {
        id: CONNECTION_PORT_TYPE.source,
        group: NsGraph.AnchorGroup.BOTTOM,
        type: NsGraph.AnchorType.OUTPUT,
        tooltip: '输出桩'
      }
    ];
    return { groups: group, items: items };
  } else if (type === 'trans') {
    const items: NsGraph.INodeAnchor[] = [
      {
        id: CONNECTION_PORT_TYPE.source,
        group: NsGraph.AnchorGroup.BOTTOM,
        type: NsGraph.AnchorType.OUTPUT,
        tooltip: '输出桩'
      },
      {
        id: CONNECTION_PORT_TYPE.target,
        group: NsGraph.AnchorGroup.TOP,
        type: NsGraph.AnchorType.INPUT,
        tooltip: '输入桩'
      }
    ];
    return { groups: group, items: items };
  } else if (type === 'sink') {
    const items: NsGraph.INodeAnchor[] = [
      {
        id: CONNECTION_PORT_TYPE.target,
        group: NsGraph.AnchorGroup.TOP,
        type: NsGraph.AnchorType.INPUT,
        tooltip: '输入桩'
      }
    ];
    return { groups: group, items: items };
  } else {
    return { groups: group, items: [] };
  }
}

/** 查询图的节点和边的数据 */
export const initGraphCmds = (app: IApplication, job: DiJob) => {
  app.executeCommandPipeline([
    // {
    //   commandId: XFlowGraphCommands.LOAD_DATA.id,
    //   getCommandOption: async () => {
    //     return {
    //       args: {
    //         loadDataService: DagService.loadJobInfo(job.id as number)
    //       }
    //     }
    //   },
    // },
    /** 4. 缩放画布 */
    {
      commandId: XFlowGraphCommands.GRAPH_ZOOM.id,
      getCommandOption: async () => {
        return {
          args: { factor: 'fit', zoomOptions: { maxScale: 0.9 } },
        }
      },
    },
  ])
}
