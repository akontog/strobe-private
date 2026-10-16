import React, { Suspense } from 'react';

const manifests = import.meta.glob('./*/lab.manifest.json', {
  eager: true,
  import: 'default'
});
const viewLoaders = import.meta.glob('./*/{StudentView,TeacherView}.jsx');

const workshops = Object.entries(manifests).reduce((registry, [manifestPath, manifest]) => {
  const directory = manifestPath.slice(0, manifestPath.lastIndexOf('/'));
  const slug = manifest.workshopSlug || manifest.slug;
  if (slug) {
    const views = Object.fromEntries(Object.entries(manifest.entry || {}).map(([role, entry]) => {
      const loader = viewLoaders[`${directory}/${entry}`];
      return [role, loader ? React.lazy(loader) : null];
    }));
    registry[slug] = { views };
  }
  return registry;
}, {});

/** Loads the role-specific workshop view declared by its manifest. */
export default function WorkshopView({ slug, role }) {
  const View = workshops[slug]?.views?.[role];

  if (!View) {
    return <p>Workshop unavailable.</p>;
  }

  return (
    <Suspense fallback={<p>Loading workshop…</p>}>
      <View />
    </Suspense>
  );
}
