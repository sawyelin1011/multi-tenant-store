import semver from 'semver';
import { PluginManifest, Dependency } from './manifest.js';

export interface PluginNode {
  manifest: PluginManifest;
  dependencies: string[];
  dependents: string[];
  installed: boolean;
  active: boolean;
}

export interface DependencyGraph {
  nodes: Map<string, PluginNode>;
  edges: Map<string, Set<string>>;
}

export interface ResolutionResult {
  success: boolean;
  resolved: string[]; // Plugin slugs in dependency order
  conflicts: Array<{
    plugin: string;
    reason: string;
    details: any;
  }>;
  missing: Array<{
    plugin: string;
    dependency: string;
    version: string;
  }>;
}

export class DependencyResolver {
  private graph: DependencyGraph = {
    nodes: new Map(),
    edges: new Map(),
  };

  /**
   * Add a plugin to the dependency graph
   */
  addPlugin(manifest: PluginManifest, installed: boolean = false, active: boolean = false): void {
    const slug = manifest.slug;
    const dependencies = (manifest.dependencies || []).map(dep => dep.name);
    const dependents: string[] = [];

    // Create node
    const node: PluginNode = {
      manifest,
      dependencies,
      dependents,
      installed,
      active,
    };

    this.graph.nodes.set(slug, node);

    // Create edges for dependencies
    if (!this.graph.edges.has(slug)) {
      this.graph.edges.set(slug, new Set());
    }

    dependencies.forEach(dep => {
      this.graph.edges.get(slug)!.add(dep);
      
      // Update dependents for the dependency
      if (this.graph.nodes.has(dep)) {
        this.graph.nodes.get(dep)!.dependents.push(slug);
      }
    });
  }

  /**
   * Remove a plugin from the dependency graph
   */
  removePlugin(slug: string): void {
    const node = this.graph.nodes.get(slug);
    if (!node) return;

    // Remove from dependents
    node.dependents.forEach(dependent => {
      const dependentNode = this.graph.nodes.get(dependent);
      if (dependentNode) {
        dependentNode.dependencies = dependentNode.dependencies.filter(dep => dep !== slug);
      }
    });

    // Remove edges
    this.graph.edges.delete(slug);

    // Remove node
    this.graph.nodes.delete(slug);
  }

  /**
   * Check if a plugin's dependencies are satisfied
   */
  checkDependencies(slug: string): {
    satisfied: boolean;
    missing: Array<{ dependency: string; version: string }>;
    conflicts: Array<{ dependency: string; reason: string }>;
  } {
    const node = this.graph.nodes.get(slug);
    if (!node) {
      return {
        satisfied: false,
        missing: [],
        conflicts: [{ dependency: slug, reason: 'Plugin not found in graph' }],
      };
    }

    const missing: Array<{ dependency: string; version: string }> = [];
    const conflicts: Array<{ dependency: string; reason: string }> = [];

    (node.manifest.dependencies || []).forEach(dep => {
      const depNode = this.graph.nodes.get(dep.name);
      
      if (!depNode) {
        missing.push({ dependency: dep.name, version: dep.version });
        return;
      }

      // Check version compatibility
      if (!semver.satisfies(depNode.manifest.version, dep.version)) {
        conflicts.push({
          dependency: dep.name,
          reason: `Version ${depNode.manifest.version} does not satisfy requirement ${dep.version}`,
        });
      }

      // Check if dependency is installed
      if (!depNode.installed && !dep.optional) {
        missing.push({ dependency: dep.name, version: dep.version });
      }
    });

    return {
      satisfied: missing.length === 0 && conflicts.length === 0,
      missing,
      conflicts,
    };
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (slug: string, path: string[]): boolean => {
      if (recursionStack.has(slug)) {
        // Found a cycle
        const cycleStart = path.indexOf(slug);
        cycles.push([...path.slice(cycleStart), slug]);
        return true;
      }

      if (visited.has(slug)) {
        return false;
      }

      visited.add(slug);
      recursionStack.add(slug);

      const node = this.graph.nodes.get(slug);
      if (node) {
        for (const dep of node.dependencies) {
          if (dfs(dep, [...path, slug])) {
            return true;
          }
        }
      }

      recursionStack.delete(slug);
      return false;
    };

    for (const slug of this.graph.nodes.keys()) {
      if (!visited.has(slug)) {
        dfs(slug, []);
      }
    }

    return cycles;
  }

  /**
   * Topological sort to determine installation order
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees
    for (const slug of this.graph.nodes.keys()) {
      inDegree.set(slug, 0);
    }

    for (const [from, toSet] of this.graph.edges.entries()) {
      for (const to of toSet) {
        inDegree.set(to, (inDegree.get(to) || 0) + 1);
      }
    }

    // Find nodes with no dependencies
    for (const [slug, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(slug);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        for (const dependent of node.dependents) {
          const newDegree = (inDegree.get(dependent) || 0) - 1;
          inDegree.set(dependent, newDegree);
          
          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    return result;
  }

  /**
   * Resolve dependencies for a set of plugins
   */
  resolveDependencies(targetSlugs: string[]): ResolutionResult {
    const result: ResolutionResult = {
      success: true,
      resolved: [],
      conflicts: [],
      missing: [],
    };

    // Check for circular dependencies
    const cycles = this.detectCircularDependencies();
    if (cycles.length > 0) {
      result.success = false;
      result.conflicts.push({
        plugin: 'system',
        reason: 'Circular dependencies detected',
        details: cycles,
      });
      return result;
    }

    // Get all plugins that need to be resolved
    const toResolve = new Set<string>(targetSlugs);
    const added = new Set<string>();

    // Add transitive dependencies
    const addDependencies = (slug: string) => {
      if (added.has(slug)) return;
      
      const node = this.graph.nodes.get(slug);
      if (!node) {
        result.missing.push({
          plugin: slug,
          dependency: slug,
          version: '*',
        });
        return;
      }

      added.add(slug);
      toResolve.add(slug);

      // Add dependencies
      (node.manifest.dependencies || []).forEach(dep => {
        if (!dep.optional) {
          addDependencies(dep.name);
        }
      });
    };

    targetSlugs.forEach(addDependencies);

    // Check all dependencies
    for (const slug of toResolve) {
      const check = this.checkDependencies(slug);
      if (!check.satisfied) {
        result.success = false;
        
        check.missing.forEach(missing => {
          result.missing.push({
            plugin: slug,
            dependency: missing.dependency,
            version: missing.version,
          });
        });

        check.conflicts.forEach(conflict => {
          result.conflicts.push({
            plugin: slug,
            reason: conflict.reason,
            details: conflict,
          });
        });
      }
    }

    if (!result.success) {
      return result;
    }

    // Get installation order
    const sorted = this.topologicalSort();
    result.resolved = sorted.filter(slug => toResolve.has(slug));

    return result;
  }

  /**
   * Get plugins that depend on a given plugin
   */
  getDependents(slug: string): string[] {
    const node = this.graph.nodes.get(slug);
    return node ? [...node.dependents] : [];
  }

  /**
   * Get all dependencies of a plugin (transitive)
   */
  getAllDependencies(slug: string): string[] {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const collect = (currentSlug: string) => {
      if (visited.has(currentSlug)) return;
      visited.add(currentSlug);

      const node = this.graph.nodes.get(currentSlug);
      if (node) {
        node.dependencies.forEach(dep => {
          dependencies.add(dep);
          collect(dep);
        });
      }
    };

    collect(slug);
    return Array.from(dependencies);
  }

  /**
   * Check if uninstalling a plugin would break other plugins
   */
  checkUninstallImpact(slug: string): {
    safe: boolean;
    affected: string[];
    broken: string[];
  } {
    const dependents = this.getDependents(slug);
    const broken: string[] = [];

    dependents.forEach(dependent => {
      const depNode = this.graph.nodes.get(dependent);
      if (depNode && depNode.installed && depNode.active) {
        // Check if this is a required dependency
        const required = (depNode.manifest.dependencies || []).some(
          dep => dep.name === slug && !dep.optional
        );
        
        if (required) {
          broken.push(dependent);
        }
      }
    });

    return {
      safe: broken.length === 0,
      affected: dependents,
      broken,
    };
  }

  /**
   * Export the current graph state
   */
  exportGraph(): {
    nodes: Array<{ slug: string; manifest: PluginManifest; installed: boolean; active: boolean }>;
    edges: Array<{ from: string; to: string }>;
  } {
    const nodes = Array.from(this.graph.nodes.entries()).map(([slug, node]) => ({
      slug,
      manifest: node.manifest,
      installed: node.installed,
      active: node.active,
    }));

    const edges: Array<{ from: string; to: string }> = [];
    for (const [from, toSet] of this.graph.edges.entries()) {
      for (const to of toSet) {
        edges.push({ from, to });
      }
    }

    return { nodes, edges };
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
    };
  }
}