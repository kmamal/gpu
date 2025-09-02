
struct VertexShaderInput {
	@location(0) position: vec2<f32>,
};

struct VertexShaderOutput {
	@builtin(position) position: vec4<f32>,
};

@vertex
fn vertex_main(in: VertexShaderInput) -> VertexShaderOutput {
	var out: VertexShaderOutput;
	out.position = vec4<f32>(in.position, 0.0, 1.0);
	return out;
}


@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var texture_sampler: sampler;
@group(0) @binding(2) var<uniform> viewport: vec4f;

struct FragmentShaderOutput {
	@location(0) color: vec4<f32>,
};

@fragment
fn fragment_main(in: VertexShaderOutput) -> FragmentShaderOutput {
	var out: FragmentShaderOutput;

	var black = vec4<f32>(0.0, 0.0, 0.0, 1.0);

	var uv = (in.position.xy - viewport.xy) / viewport.zw;
	var color = vec4<f32>(textureSample(texture, texture_sampler, uv).rgb, 1.0);

	out.color = select(
		color,
		black,
		in.position.x < viewport[0]
		|| in.position.y < viewport[1]
		|| in.position.x >= viewport[0] + viewport[2]
		|| in.position.y >= viewport[1] + viewport[3]
	);
	return out;
}
