import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'translate-pdf',
      event: {
        on: ['create', 'update'],
        includeDrafts: true,
        filter: 'delta::changedOnly(sourceFile) && defined(sourceFile)',
        projection: '{_id, sourceFile}',
      },
      timeout: 900,
    }),
  ],
})
