import {defineConfig, SanityDocumentLike, useClient} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {assist, defineAssistFieldAction} from '@sanity/assist'
import {useMemo} from 'react'

export default defineConfig({
  name: 'default',
  title: 'agent-actions',

  projectId: 'd833m1nj',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    assist({
      fieldActions: {
        useFieldActions: (props) => {
          const client = useClient({apiVersion: 'vX'})

          const {
            actionType,
            schemaId,
            documentSchemaType: {name: documentName},
            getDocumentValue,
          } = props

          const doc = getDocumentValue() as SanityDocumentLike & {
            market?: {_ref: string}
            section?: {_ref: string}
          }
          return useMemo(() => {
            if (
              actionType === 'document' &&
              documentName === 'instructions' &&
              doc.market?._ref &&
              doc.section?._ref
            ) {
              return [
                defineAssistFieldAction({
                  title: 'Summarize sections',
                  onAction: async () => {
                    console.log('Summarize sections')
                    console.log('doc', doc)
                    await client.agent.action.generate({
                      schemaId,
                      targetDocument: {operation: 'create', _type: 'summary'},
                      instruction: `using $sections ${doc.instructions}`,
                      instructionParams: {
                        sections: {
                          type: 'groq',
                          query: `*[_type == "contentSection" && market._ref == $market && section._ref == $section]`,
                          params: {
                            market: doc?.market?._ref || '',
                            section: doc?.section?._ref || '',
                          },
                        },
                      },
                    })
                  },
                }),
              ]
            }
            return []
          }, [actionType, client.agent.action, doc, documentName, schemaId])
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
