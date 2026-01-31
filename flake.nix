{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      forAllSystems = f: { x86_64-linux = f "x86_64-linux"; };
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          bunScripts = pkgs.symlinkJoin {
            name = "bun-scripts";
            paths = map (cmd: pkgs.writeShellScriptBin cmd "bun run ${cmd}") [
              "test"
            ];
          };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              biome
              bunScripts
            ];

            shellHook = ''
              # Run setup tasks in background
              (bun install && echo "Environment ready <3") &

              cat <<EOF

              Available commands:
               test               - Run JavaScript tests
               bun run lint       - Check code with Biome
               bun run lint:fix   - Auto-fix lint issues

              EOF
            '';
          };
        }
      );
    };
}
